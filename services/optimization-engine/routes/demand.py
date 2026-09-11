from fastapi import APIRouter
from models.schemas import DemandPredictionRequest, DemandPredictionResponse
from models.demand_forecaster import demand_forecaster
from models.train_demand_model import ZONES

router = APIRouter(prefix="", tags=["Demand Forecasting"])

@router.post("/predict-demand", response_model=DemandPredictionResponse)
async def predict_demand(req: DemandPredictionRequest):
    return demand_forecaster.predict(req)

@router.get("/demand-zones")
async def get_demand_zones():
    return {"zones": ZONES}
