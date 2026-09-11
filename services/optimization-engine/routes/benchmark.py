import random
import time
from fastapi import APIRouter
from models.schemas import RideRequest, Vehicle, Location, DispatchOptimizationRequest
from algorithms.vrp_optimizer import vrp_optimizer

router = APIRouter(prefix="", tags=["Benchmark"])

@router.get("/benchmark")
async def run_benchmark():
    # Generate 25 campus ride requests around Hyderabad campus coordinates
    base_lat = 17.3850
    base_lng = 78.4867

    random.seed(101)
    requests = []
    for i in range(25):
        # Pickups clustered in hostel / metro area
        p_lat = base_lat + random.uniform(-0.02, 0.02)
        p_lng = base_lng + random.uniform(-0.02, 0.02)
        # Dropoffs clustered in academic / labs / main gate
        d_lat = base_lat + random.uniform(0.01, 0.04)
        d_lng = base_lng + random.uniform(0.01, 0.04)

        requests.append(RideRequest(
            id=f"bench-req-{i+1}",
            student_id=f"student-{i+1}",
            pickup=Location(lat=p_lat, lng=p_lng, name=f"Pickup Spot {i+1}"),
            destination=Location(lat=d_lat, lng=d_lng, name=f"Academic Complex {i+1}"),
            seats_requested=1,
            desired_time="08:45"
        ))

    # 6 available vans
    vehicles = []
    for j in range(6):
        vehicles.append(Vehicle(
            id=f"bench-van-{j+1}",
            name=f"Campus Van #{j+1}",
            current_location=Location(
                lat=base_lat + random.uniform(-0.01, 0.01),
                lng=base_lng + random.uniform(-0.01, 0.01),
                name=f"Staging Depot {j+1}"
            ),
            capacity=5,
            available_seats=5,
            is_active=True
        ))

    opt_req = DispatchOptimizationRequest(
        requests=requests,
        vehicles=vehicles
    )

    t0 = time.time()
    result = vrp_optimizer.optimize_fleet(opt_req)
    t_elapsed = round((time.time() - t0) * 1000, 1)

    return {
        "status": "success",
        "benchmark_summary": {
            "total_riders_input": len(requests),
            "fleet_size_available": len(vehicles),
            "vehicles_utilized": len(result.assignments),
            "riders_served": result.metrics.get("riders_served", 0),
            "vehicle_reduction_pct": result.metrics.get("vehicle_reduction_pct", 0.0),
            "fleet_occupancy_pct": result.metrics.get("fleet_occupancy_pct", 0.0),
            "total_km_saved": result.metrics.get("total_km_saved", 0.0),
            "solve_time_ms": t_elapsed,
            "solver_engine": "Google OR-Tools VRP + PDP"
        },
        "sample_vehicle_assignments": result.assignments[:2]
    }
