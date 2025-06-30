from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    fine_tuning,
    data_preparation,
    analytics,
    admin
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(fine_tuning.router, prefix="/fine-tuning", tags=["fine-tuning"])
api_router.include_router(data_preparation.router, prefix="/data-preparation", tags=["data-preparation"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])