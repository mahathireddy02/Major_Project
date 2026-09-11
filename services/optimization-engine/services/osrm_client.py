import math
import httpx
from typing import List, Tuple, Dict, Any, Optional
from app.config import settings

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class OSRMClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.OSRM_BASE_URL
        self.timeout = 2.5  # seconds

    async def get_distance_matrix(self, coords: List[Tuple[float, float]]) -> List[List[float]]:
        """
        Returns an NxN distance matrix in kilometers.
        coords: List of (lat, lng) tuples.
        Falls back to haversine * 1.3 (road tortuosity factor) if OSRM request fails.
        """
        n = len(coords)
        if n <= 1:
            return [[0.0] * n for _ in range(n)]

        # Try OSRM Table API: coordinates formatted as {lng},{lat};{lng},{lat}
        formatted_coords = ";".join([f"{lng:.6f},{lat:.6f}" for lat, lng in coords])
        url = f"{self.base_url}/table/v1/driving/{formatted_coords}?annotations=distance,duration"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("code") == "Ok" and "distances" in data:
                        # OSRM returns distances in meters, convert to km
                        return [[d / 1000.0 if d is not None else 0.0 for d in row] for row in data["distances"]]
        except Exception:
            pass  # Fallback to haversine matrix

        # Fallback Haversine road matrix
        matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 0.0
                else:
                    # 1.3 road tortuosity factor accounts for non-straight campus roads
                    dist = haversine_distance_km(coords[i][0], coords[i][1], coords[j][0], coords[j][1]) * 1.3
                    matrix[i][j] = round(dist, 2)
        return matrix

    async def get_route(self, coords: List[Tuple[float, float]]) -> Tuple[float, float, List[List[float]]]:
        """
        Calculates driving route through given waypoints.
        coords: List of (lat, lng) tuples.
        Returns: (distance_km, duration_minutes, polyline_coords [[lat, lng], ...])
        """
        if len(coords) < 2:
            return 0.0, 0.0, coords

        formatted_coords = ";".join([f"{lng:.6f},{lat:.6f}" for lat, lng in coords])
        url = f"{self.base_url}/route/v1/driving/{formatted_coords}?overview=full&geometries=geojson"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        dist_km = route["distance"] / 1000.0
                        dur_min = route["duration"] / 60.0
                        # GeoJSON coordinates are [lng, lat], convert to [lat, lng]
                        geom = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
                        return round(dist_km, 2), round(dur_min, 1), geom
        except Exception:
            pass

        # Fallback route calculation
        total_dist = 0.0
        for i in range(len(coords) - 1):
            total_dist += haversine_distance_km(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]) * 1.3
        
        # Assume 30 km/h average speed in campus vicinity
        duration_min = (total_dist / 30.0) * 60.0
        polyline = [[c[0], c[1]] for c in coords]
        return round(total_dist, 2), round(duration_min, 1), polyline

osrm_client = OSRMClient()
