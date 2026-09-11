import math
from typing import List, Tuple, Optional, Dict, Any
from models.schemas import (
    RideRequest, ExistingRide, RideMatch, MatchScoreBreakdown,
    MatchRequest, MatchResponse, Location
)
from services.osrm_client import haversine_distance_km
from algorithms.clustering import parse_time_to_minutes

def point_to_segment_distance_km(p_lat: float, p_lng: float, a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    """Computes perpendicular distance in km from point P to line segment AB."""
    ab_dist = haversine_distance_km(a_lat, a_lng, b_lat, b_lng)
    if ab_dist < 1e-4:
        return haversine_distance_km(p_lat, p_lng, a_lat, a_lng)
    
    # Vector projection
    pa_dist = haversine_distance_km(p_lat, p_lng, a_lat, a_lng)
    pb_dist = haversine_distance_km(p_lat, p_lng, b_lat, b_lng)
    
    # If projection falls outside segment, return distance to nearest endpoint
    if pb_dist**2 >= pa_dist**2 + ab_dist**2:
        return pa_dist
    if pa_dist**2 >= pb_dist**2 + ab_dist**2:
        return pb_dist
    
    # Perpendicular distance via Heron's formula / triangle area
    s = (ab_dist + pa_dist + pb_dist) / 2.0
    area = math.sqrt(max(0.0, s * (s - ab_dist) * (s - pa_dist) * (s - pb_dist)))
    return (2.0 * area) / ab_dist

class RideMatchingEngine:
    """
    5-Factor Weighted Ride Matching & Route Insertion Optimization Engine.
    Weights:
      - Destination Similarity: 30%
      - Route Corridor Overlap: 30%
      - Time Compatibility:    20%
      - Pickup Proximity:      10%
      - Detour Minimization:   10%
    """
    def __init__(self, max_detour_km: float = 3.5):
        self.max_detour_km = max_detour_km

    def evaluate_match(self, request: RideRequest, ride: ExistingRide) -> Optional[RideMatch]:
        # 1. Hard constraint check: Available capacity
        available_seats = ride.total_capacity - ride.booked_seats
        if available_seats < request.seats_requested:
            return None

        # 2. Hard constraint check: Female-only safety policy
        if request.female_only_required and not ride.is_female_only:
            return None
        if ride.is_female_only and (request.gender or "").upper() == "MALE":
            return None

        # 3. Factor 1: Destination Similarity (Max 30 pts)
        dest_dist = haversine_distance_km(
            request.destination.lat, request.destination.lng,
            ride.destination.lat, ride.destination.lng
        )
        # Exponential decay: 0 km = 30 pts, 3 km = ~15 pts, >= 6 km = 0 pts
        dest_score = max(0.0, 30.0 * math.exp(-dest_dist / 2.5))

        # 4. Factor 2: Route Corridor Overlap (Max 30 pts)
        # Check proximity of request pickup & dropoff to ride's route trajectory
        route_coords = ride.route_coordinates
        if not route_coords or len(route_coords) < 2:
            route_coords = [
                [ride.current_location.lat, ride.current_location.lng],
                [ride.destination.lat, ride.destination.lng]
            ]

        min_pickup_dist_to_corridor = min(
            point_to_segment_distance_km(
                request.pickup.lat, request.pickup.lng,
                route_coords[k][0], route_coords[k][1],
                route_coords[k+1][0], route_coords[k+1][1]
            )
            for k in range(len(route_coords) - 1)
        )

        min_dropoff_dist_to_corridor = min(
            point_to_segment_distance_km(
                request.destination.lat, request.destination.lng,
                route_coords[k][0], route_coords[k][1],
                route_coords[k+1][0], route_coords[k+1][1]
            )
            for k in range(len(route_coords) - 1)
        )

        avg_corridor_dist = (min_pickup_dist_to_corridor + min_dropoff_dist_to_corridor) / 2.0
        route_score = max(0.0, 30.0 * math.exp(-avg_corridor_dist / 1.5))

        # 5. Factor 3: Time Compatibility (Max 20 pts)
        req_time = parse_time_to_minutes(request.desired_time)
        ride_time = parse_time_to_minutes(ride.departure_time)
        time_diff = abs(req_time - ride_time) if (req_time and ride_time) else 5.0
        time_score = max(0.0, 20.0 * max(0.0, 1.0 - (time_diff / 30.0)))

        # 6. Factor 4: Pickup Proximity (Max 10 pts)
        pickup_dist = haversine_distance_km(
            ride.current_location.lat, ride.current_location.lng,
            request.pickup.lat, request.pickup.lng
        )
        pickup_score = max(0.0, 10.0 * math.exp(-pickup_dist / 2.0))

        # 7. Factor 5: Detour Penalty & Best Stop Insertion (Max 10 pts)
        best_pickup_idx, best_dropoff_idx, detour_km = self._find_optimal_insertion(ride, request)
        if detour_km > self.max_detour_km:
            detour_score = 0.0
        else:
            detour_score = max(0.0, 10.0 * (1.0 - (detour_km / self.max_detour_km)))

        total_score = round(dest_score + route_score + time_score + pickup_score + detour_score, 1)
        extra_time_min = round((detour_km / 30.0) * 60.0, 1)

        # Recommendation explanation
        reasons = []
        if dest_score > 20:
            reasons.append("Identical destination corridor")
        if route_score > 20:
            reasons.append("High route overlap")
        if time_score > 15:
            reasons.append("Exact departure match")
        if detour_km < 1.0:
            reasons.append(f"Minimal {detour_km:.1f}km detour")
        rec_reason = " & ".join(reasons) if reasons else "Compatible shared transit route"

        breakdown = MatchScoreBreakdown(
            destination_similarity=round(dest_score, 1),
            route_overlap=round(route_score, 1),
            time_compatibility=round(time_score, 1),
            pickup_proximity=round(pickup_score, 1),
            detour_penalty=round(detour_score, 1),
            total_score=total_score
        )

        return RideMatch(
            ride_id=ride.id,
            match_score=total_score,
            breakdown=breakdown,
            additional_detour_km=round(detour_km, 2),
            additional_time_min=extra_time_min,
            insertion_pickup_index=best_pickup_idx,
            insertion_dropoff_index=best_dropoff_idx,
            recommendation_reason=rec_reason
        )

    def _find_optimal_insertion(self, ride: ExistingRide, request: RideRequest) -> Tuple[int, int, float]:
        """Finds insertion index for pickup and dropoff that minimizes extra travel distance."""
        waypoints = [(ride.current_location.lat, ride.current_location.lng)]
        for s in ride.stops:
            if "location" in s:
                loc = s["location"]
                waypoints.append((loc.get("lat", 0.0), loc.get("lng", 0.0)))
        waypoints.append((ride.destination.lat, ride.destination.lng))

        # Base distance
        base_dist = sum(
            haversine_distance_km(waypoints[i][0], waypoints[i][1], waypoints[i+1][0], waypoints[i+1][1])
            for i in range(len(waypoints) - 1)
        )

        p_pt = (request.pickup.lat, request.pickup.lng)
        d_pt = (request.destination.lat, request.destination.lng)

        best_detour = float("inf")
        best_p_idx = 0
        best_d_idx = 1

        n = len(waypoints)
        for i in range(n):
            for j in range(i, n):
                # Try inserting p at index i+1 and d at index j+2
                new_route = waypoints[:i+1] + [p_pt] + waypoints[i+1:j+1] + [d_pt] + waypoints[j+1:]
                new_dist = sum(
                    haversine_distance_km(new_route[k][0], new_route[k][1], new_route[k+1][0], new_route[k+1][1])
                    for k in range(len(new_route) - 1)
                )
                detour = max(0.0, new_dist - base_dist)
                if detour < best_detour:
                    best_detour = detour
                    best_p_idx = i + 1
                    best_d_idx = j + 2

        if best_detour == float("inf"):
            best_detour = 1.0

        return best_p_idx, best_d_idx, round(best_detour, 2)

    def match_request(self, req: MatchRequest) -> MatchResponse:
        matches: List[RideMatch] = []
        for ride in req.candidate_rides:
            eval_res = self.evaluate_match(req.request, ride)
            if eval_res and eval_res.match_score >= (req.min_score_threshold or 40.0):
                matches.append(eval_res)

        # Sort descending by match score
        matches.sort(key=lambda m: m.match_score, reverse=True)
        best = matches[0] if matches else None

        return MatchResponse(
            request_id=req.request.id,
            ranked_matches=matches,
            best_match=best,
            fallback_used=False,
            message=f"Found {len(matches)} eligible rides above threshold" if matches else "No compatible rides found"
        )
