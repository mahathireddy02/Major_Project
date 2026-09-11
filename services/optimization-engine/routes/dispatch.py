from fastapi import APIRouter
from models.schemas import DispatchOptimizationRequest, DispatchOptimizationResponse
from algorithms.vrp_optimizer import vrp_optimizer

router = APIRouter(prefix="", tags=["Dispatch Optimization"])

@router.post("/optimize-dispatch", response_model=DispatchOptimizationResponse)
async def optimize_dispatch(req: DispatchOptimizationRequest):
    return vrp_optimizer.optimize_fleet(req)
