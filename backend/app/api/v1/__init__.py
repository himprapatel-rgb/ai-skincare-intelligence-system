from fastapi import APIRouter
from app.api.v1.endpoints import auth, internal, products, scan

api_router = APIRouter()

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    internal.router,
    prefix="/internal",
    tags=["Internal"]
)

api_router.include_router(
    scan.router,
    prefix="/scan",
    tags=["Face Scan"]
)

api_router.include_router(
    products.router,
    prefix="/products",
    tags=["ML Products"]
)
