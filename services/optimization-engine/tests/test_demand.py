import pytest
from models.schemas import DemandPredictionRequest
from models.demand_forecaster import demand_forecaster

def test_demand_forecasting_morning_peak():
    req = DemandPredictionRequest(
        pickup_zone="Hostel Block A & B",
        day_of_week=1,  # Tuesday
        hour=9,         # 9:00 AM class peak
        minute_bucket=0
    )
    res = demand_forecaster.predict(req)
    assert res.predicted_demand_count > 10
    assert res.is_peak_hour is True
    assert res.surge_multiplier >= 1.2
    assert res.recommended_vehicles >= 3

def test_demand_forecasting_low_demand_night():
    req = DemandPredictionRequest(
        pickup_zone="Engineering Block",
        day_of_week=2,  # Wednesday
        hour=3,         # 3:00 AM
        minute_bucket=0
    )
    res = demand_forecaster.predict(req)
    assert res.predicted_demand_count <= 4
    assert res.is_peak_hour is False
    assert res.surge_multiplier == 1.0
