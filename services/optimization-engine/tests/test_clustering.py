import pytest
from models.schemas import RideRequest, Location
from algorithms.clustering import CandidateClusterer

def test_clustering_groups_nearby_requests():
    clusterer = CandidateClusterer(eps_km=1.5, min_samples=2)
    # 3 requests near Hostel A
    reqs = [
        RideRequest(
            id="req-1",
            pickup=Location(lat=17.3850, lng=78.4867, name="Hostel A"),
            destination=Location(lat=17.4000, lng=78.5000, name="Main Gate"),
            seats_requested=1,
            desired_time="09:00"
        ),
        RideRequest(
            id="req-2",
            pickup=Location(lat=17.3855, lng=78.4870, name="Hostel A Block 2"),
            destination=Location(lat=17.4005, lng=78.5002, name="Main Gate North"),
            seats_requested=1,
            desired_time="09:05"
        ),
        RideRequest(
            id="req-3",
            pickup=Location(lat=17.3852, lng=78.4869, name="Hostel A Mess"),
            destination=Location(lat=17.4002, lng=78.4998, name="Main Gate South"),
            seats_requested=1,
            desired_time="09:02"
        ),
    ]

    res = clusterer.cluster(reqs)
    assert len(res.clusters) >= 1
    assert res.total_requests == 3
    assert res.vehicle_reduction_count >= 1

def test_clustering_separates_female_only_requests():
    clusterer = CandidateClusterer(eps_km=2.0, min_samples=2)
    reqs = [
        RideRequest(
            id="req-f1",
            pickup=Location(lat=17.3850, lng=78.4867),
            destination=Location(lat=17.4000, lng=78.5000),
            female_only_required=True
        ),
        RideRequest(
            id="req-f2",
            pickup=Location(lat=17.3852, lng=78.4868),
            destination=Location(lat=17.4002, lng=78.5001),
            female_only_required=True
        ),
        RideRequest(
            id="req-m1",
            pickup=Location(lat=17.3851, lng=78.4867),
            destination=Location(lat=17.4001, lng=78.5000),
            female_only_required=False,
            gender="MALE"
        ),
    ]

    res = clusterer.cluster(reqs)
    female_clusters = [c for c in res.clusters if c.female_only]
    assert len(female_clusters) == 1
    assert "req-m1" not in female_clusters[0].request_ids
