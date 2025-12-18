
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
    from fastapi.responses import JSONResponse
    from app.database import SessionLocal
    
    db_ok = False
    try:
        with SessionLocal() as db:
            db.execute("SELECT 1")
        db_ok = True
    except Exception:
        db_ok = False
    
    status_code = 200 if db_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if db_ok else "degraded",
            "service": "ai-skincare-intelligence-system",
            "database": "ok" if db_ok else "error",
        },
    )
    
# Mount all routers under /api/v1 for consistency
app.include_router(api_router, prefix="/api/v1")
app.include_router(scan.router, prefix="/api/v1", tags=["scan"])  # Sprint 2: Face Scan & AI Analysis
app.include_router(digital_twin.router, prefix="/api/v1", tags=["digital_twin"])  # Sprint 3: Digital Twin
app.include_router(routines_router, prefix="/api/v1", tags=["routines"])
app.include_router(progress_router, prefix="/api/v1", tags=["progress"])
app.include_router(external_products_router, prefix="/api/v1", tags=["external_products"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])  # Admin endpoints
app.include_router(products.router, prefix="/api/v1", tags=["products"])  # Product recommendations

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
    }


# Sprint 3 Digital Twin deployment trigger - Force redeploy

# Watch path test: /backend/** configured
