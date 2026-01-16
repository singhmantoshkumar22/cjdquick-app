"""
API v1 Router - All endpoints for version 1
"""
from fastapi import APIRouter

# Core routers
from .auth import router as auth_router
from .users import router as users_router
from .companies import router as companies_router
from .locations import router as locations_router
from .skus import router as skus_router
from .inventory import router as inventory_router
from .orders import router as orders_router
from .customers import router as customers_router

# Business module routers
from .ndr import router as ndr_router
from .waves import router as waves_router
from .inbound import router as inbound_router
from .returns import router as returns_router
from .qc import router as qc_router
from .transporters import router as transporters_router

# Main v1 router
router = APIRouter(prefix="/v1")

# Include core routers
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(companies_router)
router.include_router(locations_router)
router.include_router(skus_router)
router.include_router(inventory_router)
router.include_router(orders_router)
router.include_router(customers_router)

# Include business module routers
router.include_router(ndr_router)
router.include_router(waves_router)
router.include_router(inbound_router)
router.include_router(returns_router)
router.include_router(qc_router)
router.include_router(transporters_router)
