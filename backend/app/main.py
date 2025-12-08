from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router
from app.database import engine, Base
from app.routers import scan, digital_twin
from app.models.twin_models import *  # Import Digital Twin models for table creation# Create database tables if needed (safe for local dev)
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    # In some CI or restricted environments the DB may not be available; skip silently
    pass

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
    return {"status": "healthy", "service": "ai-skincare-intelligence-system"}
app.include_router(api_router, prefix="/api/v1")
app.include_router(scan.router)  # Sprint 2: Face Scan & AI Analysis endpoints
app.include_router(digital_twin.router)  # Sprint 3: Digital Twin


@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
    }


# Sprint 3 Digital Twin deployment trigger - Force redeploy

# Watch path test: /backend/** configured
