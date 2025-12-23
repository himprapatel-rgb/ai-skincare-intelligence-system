
from app.api.v1.routines import router as routines_router
from app.api.v1.progress import router as progress_router
from app.api.v1.products import router as external_products_router
from app.routers import products
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router
from app.database import engine, Base
from app.routers import scan, digital_twin
from app.routers import admin
from app.routers import consent, profile  # GDPR & User Management
from app.models.twin_models import *  # Import Digital Twin models for table creation# Create database tables if needed (safe for local dev)
try:
    
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered skincare intelligence system",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint - always returns 200 OK"""
    return {"status": "healthy", "service": "ai-skincare-intelligence-system"}
    
# Mount all routers under /api/v1 for consistency
app.include_router(api_router, prefix="/api/v1")
app.include_router(digital_twin.router, prefix="/api/v1", tags=["digital_twin"])  # Sprint 3: Digital Twin
app.include_router(routines_router, prefix="/api/v1", tags=["routines"])
app.include_router(progress_router, prefix="/api/v1", tags=["progress"])
app.include_router(external_products_router, prefix="/api/v1", tags=["external_products"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])  # Admin endpoints
app.include_router(consent.router, prefix="/api/v1", tags=["consent"])  # GDPR Compliance (FR44-FR46)
app.include_router(profile.router, prefix="/api/v1", tags=["profile"])  # User Profile Management

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
    }


# Sprint 3 Digital Twin deployment trigger - Force redeploy

# Watch path test: /backend/** configured
