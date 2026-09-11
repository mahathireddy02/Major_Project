import pytest
from models.schemas import RideRequest, Vehicle, Location, DispatchOptimizationRequest
from algorithms.vrp_optimizer import vrp_optimizer

def test_vrp_optimizer_assigns_and_pools():
    reqs = [
        RideRequest(
            id="vrp-req-1",
            pickup=Location(lat=17.3850, lng=78.4867, name="Hostel 1"),
            destination=Location(lat=17.3950, lng=78.4967, name="Dept of CS"),
            seats_requested=1
        ),
        RideRequest(
            id="vrp-req-2",
            pickup=Location(lat=17.3860, lng=78.4870, name="Hostel 2"),
            destination=Location(lat=17.3960, lng=78.4970, name="Dept of EE"),
            seats_requested=1
        ),
        RideRequest(
            id="vrp-req-3",
            pickup=Location(lat=17.3855, lng=78.4865, name="Hostel 3"),
            destination=Location(lat=17.3955, lng=78.4965, name="Admin Block"),
            seats_requested=1
        )
    ]

    vehicles = [
        Vehicle(
            id="veh-van-1",
            name="Campus Shuttle Alpha",
            current_location=Location(lat=17.3840, lng=78.4850, name="Depot"),
            capacity=4,
            available_seats=4
        )
    ]

    opt_req = DispatchOptimizationRequest(requests=reqs, vehicles=vehicles)
    res = vrp_optimizer.optimize_fleet(opt_req)

    assert len(res.assignments) == 1
    assignment = res.assignments[0]
    assert len(assignment.assigned_request_ids) == 3
    assert assignment.occupancy_rate == 75.0  # 3 / 4 seats
    assert res.metrics["solver_status"] == "OPTIMAL"
    assert res.metrics["vehicle_reduction_pct"] > 50.0

    # Verify pickup occurs before dropoff for each request
    stop_req_types = [(s.request_id, s.stop_type) for s in assignment.stops if s.request_id]
    for r in reqs:
        p_idx = [i for i, (rid, st) in enumerate(stop_req_types) if rid == r.id and st == "pickup"][0]
        d_idx = [i for i, (rid, st) in enumerate(stop_req_types) if rid == r.id and st == "dropoff"][0]
        assert p_idx < d_idx, f"Pickup for {r.id} must occur before dropoff"
