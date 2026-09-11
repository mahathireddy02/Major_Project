from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Location(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    name: Optional[str] = ""

class RideRequest(BaseModel):
    id: str
    student_id: Optional[str] = ""
    pickup: Location
    destination: Location
    desired_time: Optional[str] = None  # ISO timestamp or HH:MM
    seats_requested: int = Field(default=1, ge=1, le=10)
    gender: Optional[str] = "ANY"
    female_only_required: bool = False

class Vehicle(BaseModel):
    id: str
    name: str
    current_location: Location
    capacity: int = Field(default=4, ge=1)
    available_seats: int = Field(default=4, ge=0)
    driver_gender: Optional[str] = "ANY"
    is_active: bool = True

class ExistingRide(BaseModel):
    id: str
    vehicle_id: str
    driver_id: Optional[str] = ""
    driver_name: Optional[str] = ""
    current_location: Location
    destination: Location
    route_coordinates: List[List[float]] = []  # [[lat, lng], ...]
    stops: List[Dict[str, Any]] = []
    booked_seats: int = 0
    total_capacity: int = 4
    departure_time: Optional[str] = None
    is_female_only: bool = False

# --- Clustering Schemas ---

class Cluster(BaseModel):
    cluster_id: int
    request_ids: List[str]
    center_pickup: Location
    center_destination: Location
    total_passengers: int
    female_only: bool
    suggested_vehicle_type: str
    estimated_pickup_window: str

class ClusterRequest(BaseModel):
    requests: List[RideRequest]
    eps_km: Optional[float] = 1.2
    min_samples: Optional[int] = 2

class ClusterResponse(BaseModel):
    clusters: List[Cluster]
    unclustered_request_ids: List[str]
    total_requests: int
    vehicle_reduction_count: int
    message: str = "Clustering completed"

# --- Matching Schemas ---

class MatchScoreBreakdown(BaseModel):
    destination_similarity: float = Field(..., description="0-15 points")
    route_overlap: float = Field(..., description="0-15 points")
    time_compatibility: float = Field(..., description="0-5 points")
    pickup_proximity: float = Field(..., description="0-40 points")
    detour_penalty: float = Field(..., description="0-10 points")
    active_ride_bonus: Optional[float] = Field(default=0.0, description="0-15 points")
    driver_distance_km: Optional[float] = Field(default=0.0, description="Driver distance in km")
    total_score: float = Field(..., description="0-100 total match score")

class RideMatch(BaseModel):
    ride_id: str
    match_score: float
    breakdown: MatchScoreBreakdown
    additional_detour_km: float
    additional_time_min: float
    insertion_pickup_index: int
    insertion_dropoff_index: int
    recommendation_reason: str
    driver_distance_km: Optional[float] = 0.0

class MatchRequest(BaseModel):
    request: RideRequest
    candidate_rides: List[ExistingRide]
    min_score_threshold: Optional[float] = 40.0

class MatchResponse(BaseModel):
    request_id: str
    ranked_matches: List[RideMatch]
    best_match: Optional[RideMatch] = None
    fallback_used: bool = False
    message: str = "Matching complete"

# --- Dispatch & VRP Schemas ---

class OptimizedRouteStop(BaseModel):
    sequence: int
    stop_type: str  # "pickup" | "dropoff" | "start"
    location: Location
    request_id: Optional[str] = None
    eta_minutes: float = 0.0
    cumulative_distance_km: float = 0.0

class VehicleAssignment(BaseModel):
    vehicle_id: str
    vehicle_name: str
    assigned_request_ids: List[str]
    stops: List[OptimizedRouteStop]
    route_geometry: Optional[List[List[float]]] = None
    total_distance_km: float
    total_duration_minutes: float
    occupancy_rate: float

class DispatchOptimizationRequest(BaseModel):
    requests: List[RideRequest]
    vehicles: List[Vehicle]
    max_detour_ratio: Optional[float] = 1.35

class DispatchOptimizationResponse(BaseModel):
    assignments: List[VehicleAssignment]
    unassigned_request_ids: List[str]
    metrics: Dict[str, Any]
    message: str = "Dispatch optimization complete"

# --- Demand Forecasting Schemas ---

class DemandPredictionRequest(BaseModel):
    pickup_zone: str = "Main Campus"
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    hour: int = Field(..., ge=0, le=23)
    minute_bucket: int = Field(default=0, ge=0, le=59)
    is_holiday_or_weekend: bool = False

class DemandPredictionResponse(BaseModel):
    pickup_zone: str
    timestamp_queried: str
    predicted_demand_count: int
    surge_multiplier: float
    is_peak_hour: bool
    recommended_vehicles: int
    confidence_interval: List[int]
