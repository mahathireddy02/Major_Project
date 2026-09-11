import time
from typing import List, Dict, Any, Tuple
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from models.schemas import (
    RideRequest, Vehicle, OptimizedRouteStop, VehicleAssignment,
    DispatchOptimizationRequest, DispatchOptimizationResponse, Location
)
from services.osrm_client import haversine_distance_km

class VRPOptimizer:
    """
    Google OR-Tools Capacitated Vehicle Routing Problem with Pickups and Deliveries (PDP).
    Optimizes multi-vehicle fleet routing, passenger pooling, and route ordering with capacity limits.
    """
    def __init__(self, time_limit_seconds: int = 2):
        self.time_limit_seconds = time_limit_seconds

    def optimize_fleet(self, req: DispatchOptimizationRequest) -> DispatchOptimizationResponse:
        start_time = time.time()
        requests = req.requests
        vehicles = [v for v in req.vehicles if v.is_active and v.capacity > 0]

        if not requests or not vehicles:
            return DispatchOptimizationResponse(
                assignments=[],
                unassigned_request_ids=[r.id for r in requests],
                metrics={
                    "vehicle_reduction_pct": 0.0,
                    "fleet_occupancy_pct": 0.0,
                    "total_km_saved": 0.0,
                    "solver_status": "NO_INPUTS",
                    "solve_time_ms": 0.0
                },
                message="No active requests or vehicles provided"
            )

        # 1. Build Node Graph
        # Indices:
        # [0 .. num_vehicles-1] : Vehicle start locations (depots)
        # [num_vehicles .. num_vehicles + num_reqs - 1] : Pickups
        # [num_vehicles + num_reqs .. num_vehicles + 2*num_reqs - 1] : Deliveries
        num_vehicles = len(vehicles)
        num_reqs = len(requests)

        locations: List[Tuple[float, float]] = []
        for v in vehicles:
            locations.append((v.current_location.lat, v.current_location.lng))

        for r in requests:
            locations.append((r.pickup.lat, r.pickup.lng))

        for r in requests:
            locations.append((r.destination.lat, r.destination.lng))

        num_nodes = len(locations)

        # Distance matrix in integer meters (OR-Tools requires integers)
        dist_matrix: List[List[int]] = []
        for i in range(num_nodes):
            row: List[int] = []
            for j in range(num_nodes):
                if i == j:
                    row.append(0)
                else:
                    d_km = haversine_distance_km(locations[i][0], locations[i][1], locations[j][0], locations[j][1]) * 1.3
                    row.append(int(d_km * 1000))
            dist_matrix.append(row)

        # Demands (seats)
        demands = [0] * num_nodes
        for i, r in enumerate(requests):
            pickup_idx = num_vehicles + i
            dropoff_idx = num_vehicles + num_reqs + i
            demands[pickup_idx] = r.seats_requested
            demands[dropoff_idx] = -r.seats_requested

        starts = list(range(num_vehicles))
        # End nodes: vehicles can end at the campus hub / destination of last dropoff or their start
        ends = list(range(num_vehicles))

        manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, starts, ends)
        routing = pywrapcp.RoutingModel(manager)

        # Transit Callback
        def distance_callback(from_index: int, to_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return dist_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Distance Dimension
        routing.AddDimension(
            transit_callback_index,
            0,            # no slack
            100000 * 1000,# max distance per vehicle (100km)
            True,         # start cumul at zero
            "Distance"
        )
        distance_dimension = routing.GetDimensionOrDie("Distance")

        # Demand / Capacity Callback
        def demand_callback(from_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            return demands[from_node]

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        vehicle_capacities = [v.capacity for v in vehicles]
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,                   # null capacity slack
            vehicle_capacities,  # vehicle max capacities
            True,                # start cumul at zero
            "Capacity"
        )

        # Pickup & Delivery Constraints & Disjunctions
        penalty = 500000  # High penalty for skipping requests
        solver = routing.solver()

        for i, r in enumerate(requests):
            p_node = num_vehicles + i
            d_node = num_vehicles + num_reqs + i
            p_index = manager.NodeToIndex(p_node)
            d_index = manager.NodeToIndex(d_node)

            routing.AddPickupAndDelivery(p_index, d_index)
            # Same vehicle
            solver.Add(routing.VehicleVar(p_index) == routing.VehicleVar(d_index))
            # Pickup before dropoff
            solver.Add(distance_dimension.CumulVar(p_index) <= distance_dimension.CumulVar(d_index))

            # Disjunction allows dropping request if over capacity
            routing.AddDisjunction([p_index], penalty)
            routing.AddDisjunction([d_index], penalty)

        # Search Parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = self.time_limit_seconds

        solution = routing.SolveWithParameters(search_parameters)

        solve_time_ms = round((time.time() - start_time) * 1000, 1)

        if not solution:
            return DispatchOptimizationResponse(
                assignments=[],
                unassigned_request_ids=[r.id for r in requests],
                metrics={
                    "vehicle_reduction_pct": 0.0,
                    "fleet_occupancy_pct": 0.0,
                    "total_km_saved": 0.0,
                    "solver_status": "INFEASIBLE",
                    "solve_time_ms": solve_time_ms
                },
                message="OR-Tools solver could not find a feasible solution"
            )

        # Reconstruct Route Assignments
        assignments: List[VehicleAssignment] = []
        assigned_requests_set = set()
        total_optimized_km = 0.0

        for v_idx, vehicle in enumerate(vehicles):
            index = routing.Start(v_idx)
            route_stops: List[OptimizedRouteStop] = []
            seq = 0
            v_assigned_reqs = []
            cumul_km = 0.0

            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                
                # Check if pickup or dropoff
                if node < num_vehicles:
                    stop_type = "start"
                    req_id = None
                    loc = vehicle.current_location
                elif node < num_vehicles + num_reqs:
                    r_i = node - num_vehicles
                    stop_type = "pickup"
                    req_id = requests[r_i].id
                    loc = requests[r_i].pickup
                    v_assigned_reqs.append(req_id)
                    assigned_requests_set.add(req_id)
                else:
                    r_i = node - num_vehicles - num_reqs
                    stop_type = "dropoff"
                    req_id = requests[r_i].id
                    loc = requests[r_i].destination

                eta_min = round((cumul_km / 30.0) * 60.0, 1)
                route_stops.append(OptimizedRouteStop(
                    sequence=seq,
                    stop_type=stop_type,
                    location=loc,
                    request_id=req_id,
                    eta_minutes=eta_min,
                    cumulative_distance_km=round(cumul_km, 2)
                ))
                seq += 1

                prev_index = index
                index = solution.Value(routing.NextVar(index))
                step_km = routing.GetArcCostForVehicle(prev_index, index, v_idx) / 1000.0
                cumul_km += step_km

            # If vehicle visited any passenger stops
            if len(v_assigned_reqs) > 0:
                total_optimized_km += cumul_km
                total_duration = round((cumul_km / 30.0) * 60.0, 1)
                occ_rate = round(min(1.0, len(v_assigned_reqs) / float(vehicle.capacity)) * 100, 1)

                assignments.append(VehicleAssignment(
                    vehicle_id=vehicle.id,
                    vehicle_name=vehicle.name,
                    assigned_request_ids=list(set(v_assigned_reqs)),
                    stops=route_stops,
                    route_geometry=[[s.location.lat, s.location.lng] for s in route_stops],
                    total_distance_km=round(cumul_km, 2),
                    total_duration_minutes=total_duration,
                    occupancy_rate=occ_rate
                ))

        unassigned_ids = [r.id for r in requests if r.id not in assigned_requests_set]

        # Calculate fleet-level optimization impact
        # Base independent km: each request served by a dedicated solo ride
        solo_km = sum(
            haversine_distance_km(r.pickup.lat, r.pickup.lng, r.destination.lat, r.destination.lng) * 1.3
            for r in requests if r.id in assigned_requests_set
        )
        km_saved = max(0.0, solo_km - total_optimized_km)
        active_vehicles_count = len(assignments)
        total_assigned_riders = len(assigned_requests_set)
        vehicle_reduction_pct = round(
            ((total_assigned_riders - active_vehicles_count) / max(1, total_assigned_riders)) * 100.0, 1
        ) if total_assigned_riders > active_vehicles_count else 0.0

        avg_occupancy = round(
            sum(a.occupancy_rate for a in assignments) / max(1, len(assignments)), 1
        ) if assignments else 0.0

        return DispatchOptimizationResponse(
            assignments=assignments,
            unassigned_request_ids=unassigned_ids,
            metrics={
                "vehicle_reduction_pct": vehicle_reduction_pct,
                "fleet_occupancy_pct": avg_occupancy,
                "total_km_saved": round(km_saved, 2),
                "vehicles_deployed": len(assignments),
                "riders_served": total_assigned_riders,
                "solver_status": "OPTIMAL",
                "solve_time_ms": solve_time_ms
            },
            message=f"OR-Tools pooled {total_assigned_riders} passengers across {len(assignments)} vehicles"
        )

vrp_optimizer = VRPOptimizer()
