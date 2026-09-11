import pytest
from models.schemas import RideRequest, ExistingRide, Location, MatchRequest
from algorithms.matching import RideMatchingEngine

def test_matching_scores_compatible_ride():
    engine = RideMatchingEngine()
    req = RideRequest(
        id="r-test-1",
        pickup=Location(lat=17.3850, lng=78.4867, name="Hostel A"),
        destination=Location(lat=17.4000, lng=78.5000, name="Library"),
        seats_requested=1,
        desired_time="09:00"
    )

    ride = ExistingRide(
        id="ride-101",
        vehicle_id="veh-1",
        current_location=Location(lat=17.3845, lng=78.4860),
        destination=Location(lat=17.4010, lng=78.5005),
        route_coordinates=[[17.3845, 78.4860], [17.4010, 78.5005]],
        stops=[],
        booked_seats=1,
        total_capacity=4,
        departure_time="09:05"
    )

    match_res = engine.match_request(MatchRequest(request=req, candidate_rides=[ride]))
    assert len(match_res.ranked_matches) == 1
    best = match_res.best_match
    assert best is not None
    assert best.match_score >= 60.0
    assert best.breakdown.destination_similarity > 20.0
    assert best.breakdown.total_score == best.match_score

def test_matching_rejects_full_vehicle():
    engine = RideMatchingEngine()
    req = RideRequest(
        id="r-test-2",
        pickup=Location(lat=17.3850, lng=78.4867),
        destination=Location(lat=17.4000, lng=78.5000),
        seats_requested=2
    )

    full_ride = ExistingRide(
        id="ride-full",
        vehicle_id="veh-full",
        current_location=Location(lat=17.3850, lng=78.4867),
        destination=Location(lat=17.4000, lng=78.5000),
        booked_seats=4,
        total_capacity=4
    )

    match_res = engine.match_request(MatchRequest(request=req, candidate_rides=[full_ride]))
    assert len(match_res.ranked_matches) == 0
