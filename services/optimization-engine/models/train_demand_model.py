import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

ZONES = [
    "Main Campus Gate",
    "Hostel Block A & B",
    "Hostel Block C (Girls)",
    "Engineering Block",
    "Central Library",
    "Cafeteria & Student Activity Center",
    "Sports Complex",
    "Metro Feeder Station"
]

def generate_synthetic_campus_data(num_days: int = 21) -> pd.DataFrame:
    """
    Generates realistic campus ride demand across 21 days of 30-minute time intervals.
    Models distinct peak patterns:
      - Morning class rush (08:00 - 09:30)
      - Lunch transition (12:30 - 14:00)
      - Evening exit/hostel rush (16:30 - 18:30)
      - Late night library runs (21:00 - 22:30)
    """
    records = []
    np.random.seed(42)

    for day in range(num_days):
        dow = day % 7
        is_weekend = 1 if dow in (5, 6) else 0

        for hour in range(24):
            for minute_bucket in [0, 30]:
                time_float = hour + (minute_bucket / 60.0)

                for zone in ZONES:
                    base_demand = 1.0

                    if not is_weekend:
                        # Morning rush (Hostels -> Academic blocks)
                        if 8.0 <= time_float <= 9.5:
                            base_demand += 18.0 if "Hostel" in zone or "Metro" in zone else 8.0
                        # Lunch rush
                        elif 12.5 <= time_float <= 14.0:
                            base_demand += 12.0 if "Cafeteria" in zone or "Engineering" in zone else 6.0
                        # Evening exit rush (Academic -> Metro / Hostels)
                        elif 16.5 <= time_float <= 18.5:
                            base_demand += 22.0 if "Engineering" in zone or "Main Campus" in zone else 10.0
                        # Late night library/hostel trips
                        elif 20.5 <= time_float <= 22.5:
                            base_demand += 9.0 if "Library" in zone or "Hostel" in zone else 2.0
                        else:
                            base_demand += 2.0
                    else:
                        # Weekend pattern
                        if 11.0 <= time_float <= 19.0:
                            base_demand += 7.0 if "Metro" in zone or "Sports" in zone or "Hostel" in zone else 2.0
                        else:
                            base_demand += 1.0

                    # Add random Poisson/Gaussian variation
                    noise = np.random.normal(0, 1.5)
                    demand = max(0, int(round(base_demand + noise)))

                    records.append({
                        "zone": zone,
                        "day_of_week": dow,
                        "hour": hour,
                        "minute_bucket": minute_bucket,
                        "is_weekend": is_weekend,
                        "demand": demand
                    })

    return pd.DataFrame(records)

def train_and_save_demand_model(output_path: str | None = None) -> Pipeline:
    print("Generating synthetic campus demand training data...")
    df = generate_synthetic_campus_data(num_days=21)

    X = df[["zone", "day_of_week", "hour", "minute_bucket", "is_weekend"]]
    y = df["demand"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["zone"]),
            ("num", "passthrough", ["day_of_week", "hour", "minute_bucket", "is_weekend"])
        ]
    )

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=30, max_depth=12, random_state=42, n_jobs=1))
    ])

    print("Fitting RandomForestRegressor on campus demand features...")
    model.fit(X, y)

    if output_path is None:
        base_dir = os.path.dirname(__file__)
        output_dir = os.path.join(base_dir, "artifacts")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "demand_rf_model.joblib")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    joblib.dump(model, output_path)
    print(f"Model successfully saved to {output_path}")
    return model

if __name__ == "__main__":
    train_and_save_demand_model()
