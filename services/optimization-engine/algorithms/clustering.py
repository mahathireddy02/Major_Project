import math
import numpy as np
from typing import List, Tuple, Dict, Any
from sklearn.cluster import DBSCAN
from models.schemas import RideRequest, Cluster, ClusterResponse, Location
from services.osrm_client import haversine_distance_km

def parse_time_to_minutes(time_str: str | None) -> int:
    """Helper to convert time string (ISO or HH:MM) to minutes from start of day."""
    if not time_str:
        return 0
    try:
        # Check if HH:MM
        if ":" in time_str:
            parts = time_str.split("T")[-1].split("Z")[0].split(":")
            return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        pass
    return 0

class CandidateClusterer:
    """
    DBSCAN-based Spatiotemporal Clustering Engine with Gender Safety Constraints.
    Clusters ride requests by pickup proximity, destination alignment, and time window compatibility.
    """
    def __init__(self, eps_km: float = 1.2, min_samples: int = 2, max_dest_dist_km: float = 2.5, time_window_min: int = 15):
        self.eps_km = eps_km
        self.min_samples = min_samples
        self.max_dest_dist_km = max_dest_dist_km
        self.time_window_min = time_window_min

    def cluster(self, requests: List[RideRequest]) -> ClusterResponse:
        if not requests:
            return ClusterResponse(
                clusters=[],
                unclustered_request_ids=[],
                total_requests=0,
                vehicle_reduction_count=0,
                message="No requests provided"
            )

        # 1. Enforce strict safety partition: Female-only vs Standard pool
        female_only_requests = [r for r in requests if r.female_only_required]
        standard_requests = [r for r in requests if not r.female_only_required]

        all_clusters: List[Cluster] = []
        unclustered_ids: List[str] = []
        cluster_id_counter = 1

        for pool, is_female_pool in [(female_only_requests, True), (standard_requests, False)]:
            if len(pool) < self.min_samples:
                unclustered_ids.extend([r.id for r in pool])
                continue

            # Convert pickup coords to radians for Haversine metric
            pickup_coords_rad = np.radians([[r.pickup.lat, r.pickup.lng] for r in pool])
            
            # Epsilon in radians (km / earth_radius)
            eps_radians = self.eps_km / 6371.0
            db = DBSCAN(eps=eps_radians, min_samples=self.min_samples, metric='haversine')
            labels = db.fit_predict(pickup_coords_rad)

            # Group requests by DBSCAN cluster label
            clusters_map: Dict[int, List[RideRequest]] = {}
            for idx, label in enumerate(labels):
                if label == -1:
                    unclustered_ids.append(pool[idx].id)
                else:
                    if label not in clusters_map:
                        clusters_map[label] = []
                    clusters_map[label].append(pool[idx])

            # Post-process clusters: verify destination & time window coherence
            for label, cluster_reqs in clusters_map.items():
                refined_subgroups = self._refine_by_destination_and_time(cluster_reqs)
                for subgroup in refined_subgroups:
                    if len(subgroup) >= self.min_samples:
                        cluster_obj = self._build_cluster(cluster_id_counter, subgroup, is_female_pool)
                        all_clusters.append(cluster_obj)
                        cluster_id_counter += 1
                    else:
                        unclustered_ids.extend([r.id for r in subgroup])

        total_passengers_clustered = sum(len(c.request_ids) for c in all_clusters)
        vehicle_reduction = max(0, total_passengers_clustered - len(all_clusters))

        return ClusterResponse(
            clusters=all_clusters,
            unclustered_request_ids=unclustered_ids,
            total_requests=len(requests),
            vehicle_reduction_count=vehicle_reduction,
            message=f"Formed {len(all_clusters)} clusters across {len(requests)} requests"
        )

    def _refine_by_destination_and_time(self, reqs: List[RideRequest]) -> List[List[RideRequest]]:
        """Sub-splits a pickup cluster if destinations diverge or times mismatch."""
        subgroups: List[List[RideRequest]] = []
        visited = set()

        for i in range(len(reqs)):
            if i in visited:
                continue
            current_group = [reqs[i]]
            visited.add(i)
            t_i = parse_time_to_minutes(reqs[i].desired_time)

            for j in range(i + 1, len(reqs)):
                if j in visited:
                    continue
                # Destination distance
                d_dist = haversine_distance_km(
                    reqs[i].destination.lat, reqs[i].destination.lng,
                    reqs[j].destination.lat, reqs[j].destination.lng
                )
                t_j = parse_time_to_minutes(reqs[j].desired_time)
                time_diff = abs(t_i - t_j) if (t_i and t_j) else 0

                if d_dist <= self.max_dest_dist_km and time_diff <= self.time_window_min:
                    current_group.append(reqs[j])
                    visited.add(j)

            subgroups.append(current_group)
        return subgroups

    def _build_cluster(self, cid: int, reqs: List[RideRequest], female_only: bool) -> Cluster:
        center_lat_p = float(np.mean([r.pickup.lat for r in reqs]))
        center_lng_p = float(np.mean([r.pickup.lng for r in reqs]))
        center_lat_d = float(np.mean([r.destination.lat for r in reqs]))
        center_lng_d = float(np.mean([r.destination.lng for r in reqs]))

        total_passengers = sum(r.seats_requested for r in reqs)

        if total_passengers <= 4:
            v_type = "Electric Sedan / Standard Van (4-seater)"
        elif total_passengers <= 7:
            v_type = "Shuttle Minivan (7-seater)"
        else:
            v_type = "Campus Shuttle Bus (12-seater)"

        pickup_names = [r.pickup.name for r in reqs if r.pickup.name]
        common_pickup = pickup_names[0] if pickup_names else f"{center_lat_p:.3f}, {center_lng_p:.3f}"
        dest_names = [r.destination.name for r in reqs if r.destination.name]
        common_dest = dest_names[0] if dest_names else f"{center_lat_d:.3f}, {center_lng_d:.3f}"

        return Cluster(
            cluster_id=cid,
            request_ids=[r.id for r in reqs],
            center_pickup=Location(lat=center_lat_p, lng=center_lng_p, name=f"Hub: {common_pickup}"),
            center_destination=Location(lat=center_lat_d, lng=center_lng_d, name=f"Dropoff: {common_dest}"),
            total_passengers=total_passengers,
            female_only=female_only,
            suggested_vehicle_type=v_type,
            estimated_pickup_window="08:30 - 08:45"
        )
