from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router
from app.database import engine, Base

# Create database tables if needed (safe for local dev)
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

app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "AI Skincare Intelligence System API", "version": settings.APP_VERSION}
