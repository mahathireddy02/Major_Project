from fastapi import APIRouter
from models.schemas import ClusterRequest, ClusterResponse
from algorithms.clustering import CandidateClusterer

router = APIRouter(prefix="", tags=["Clustering"])

@router.post("/cluster-requests", response_model=ClusterResponse)
async def cluster_requests(req: ClusterRequest):
    clusterer = CandidateClusterer(
        eps_km=req.eps_km or 1.2,
        min_samples=req.min_samples or 2
    )
    return clusterer.cluster(req.requests)
