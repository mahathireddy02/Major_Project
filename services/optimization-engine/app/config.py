import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Campus Mobility AI Optimization Engine"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "artifacts")
    
    # Campus optimization parameters
    MAX_WALKING_DISTANCE_KM: float = 0.5
    MAX_DETOUR_PERCENTAGE: float = 35.0  # 35% max detour over direct route
    DEFAULT_VEHICLE_CAPACITY: int = 4
    CLUSTER_EPS_KM: float = 1.2          # DBSCAN spatial epsilon in kilometers
    CLUSTER_MIN_SAMPLES: int = 2
    TIME_WINDOW_MINUTES: int = 15

settings = Settings()
