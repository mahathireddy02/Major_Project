import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from routes.cluster import router as cluster_router
from routes.match import router as match_router
from routes.dispatch import router as dispatch_router
from routes.demand import router as demand_router
from routes.benchmark import router as benchmark_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Dedicated transportation intelligence service providing DBSCAN clustering, 5-factor weighted matching, Google OR-Tools VRP optimization, and Random Forest demand forecasting."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(cluster_router)
app.include_router(match_router)
app.include_router(dispatch_router)
app.include_router(demand_router)
app.include_router(benchmark_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "Python 3.12 / FastAPI / OR-Tools / Scikit-Learn"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
