from fastapi import APIRouter
from models.schemas import MatchRequest, MatchResponse, RideRequest, ExistingRide
from algorithms.matching import RideMatchingEngine

router = APIRouter(prefix="", tags=["Matching"])
matching_engine = RideMatchingEngine()

@router.post("/match-request", response_model=MatchResponse)
async def match_request(req: MatchRequest):
    return matching_engine.match_request(req)

@router.post("/optimize-ride")
async def optimize_ride_insertion(request: RideRequest, ride: ExistingRide):
    eval_res = matching_engine.evaluate_match(request, ride)
    if not eval_res:
        return {"matched": False, "reason": "Capacity or female-only constraints violated"}
    return {"matched": True, "match": eval_res}
