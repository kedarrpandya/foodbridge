from fastapi import APIRouter
from .auth import router as auth_router
from .orgs import router as orgs_router
from .items import router as items_router
from .analytics import router as analytics_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(orgs_router)
api_router.include_router(items_router)
api_router.include_router(analytics_router)


