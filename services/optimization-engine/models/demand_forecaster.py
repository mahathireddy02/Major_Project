import os
import datetime
import pandas as pd
import joblib
from models.schemas import DemandPredictionRequest, DemandPredictionResponse
from models.train_demand_model import train_and_save_demand_model

class DemandForecaster:
    def __init__(self, model_path: str | None = None):
        if model_path is None:
            base_dir = os.path.dirname(__file__)
            model_path = os.path.join(base_dir, "artifacts", "demand_rf_model.joblib")
        
        self.model_path = model_path
        self.model = self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.model_path):
            try:
                return joblib.load(self.model_path)
            except Exception as e:
                print(f"Error loading existing model: {e}. Retraining...")
        return train_and_save_demand_model(self.model_path)

    def predict(self, req: DemandPredictionRequest) -> DemandPredictionResponse:
        input_df = pd.DataFrame([{
            "zone": req.pickup_zone,
            "day_of_week": req.day_of_week,
            "hour": req.hour,
            "minute_bucket": 30 if req.minute_bucket >= 30 else 0,
            "is_weekend": 1 if req.is_holiday_or_weekend or req.day_of_week in (5, 6) else 0
        }])

        pred_val = float(self.model.predict(input_df)[0])
        predicted_count = max(0, int(round(pred_val)))

        # Dynamic surge multiplier based on expected volume
        if predicted_count >= 18:
            surge = 1.6
            is_peak = True
        elif predicted_count >= 12:
            surge = 1.3
            is_peak = True
        elif predicted_count >= 7:
            surge = 1.1
            is_peak = False
        else:
            surge = 1.0
            is_peak = False

        # Recommended vehicle staging (assume avg 3.5 passengers per van)
        recommended_vans = max(1, int(round(predicted_count / 3.5)))

        # Confidence bounds (+- 20%)
        low_bound = max(0, int(round(predicted_count * 0.8)))
        high_bound = int(round(predicted_count * 1.25))

        now_str = datetime.datetime.now().isoformat()

        return DemandPredictionResponse(
            pickup_zone=req.pickup_zone,
            timestamp_queried=now_str,
            predicted_demand_count=predicted_count,
            surge_multiplier=surge,
            is_peak_hour=is_peak,
            recommended_vehicles=recommended_vans,
            confidence_interval=[low_bound, high_bound]
        )

demand_forecaster = DemandForecaster()
