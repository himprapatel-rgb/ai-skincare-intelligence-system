"""Admin router for administrative operations."""
import sys
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import logging

# Add backend directory to path for script imports
backend_dir = Path(__file__).resolve().parent.parent.parent
scripts_dir = backend_dir / "scripts"
sys.path.insert(0, str(backend_dir))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class SeedResponse(BaseModel):
    """Response model for seed operations."""
    status: str
    message: str
    task_id: Optional[str] = None


@router.post("/seed-database", response_model=SeedResponse)
async def seed_database(background_tasks: BackgroundTasks):
    """
    Trigger database seeding in the background.
    
    This endpoint runs import scripts that populate the database 
    with all training datasets (CosIng, CSCP, OBF, etc.).
    """
    try:
        # Run seed scripts in background
        async def run_seed():
            try:
                logger.info("Starting database seeding...")
                
                # Import and run CosIng
                logger.info("[1/6] Importing CosIng ingredients...")
                from scripts import import_cosing
                import_cosing.main()
                
                logger.info("[2/6] Importing CSCP hazards...")
                from scripts import import_cscp
                import_cscp.main()
                
                logger.info("[3/6] Importing Sephora products...")
                from scripts import import_sephora
                import_sephora.main()
                
                logger.info("[4/6] Importing HAM10000 images...")
                from scripts import import_ham10000
                import_ham10000.main()
                
                logger.info("[5/6] Importing ISIC images...")
                from scripts import import_isic
                import_isic.main()
                
                logger.info("[6/6] Importing Open Beauty Facts...")
                from scripts import import_open_beauty_facts
                import_open_beauty_facts.main()
                
                logger.info("✅ Database seeding completed successfully!")
            except Exception as e:
                logger.error(f"❌ Seed failed: {str(e)}", exc_info=True)
        
        # Schedule background task
        background_tasks.add_task(run_seed)
        
        return SeedResponse(
            status="started",
            message="Database seeding started in background. Check logs for progress."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start seeding: {str(e)}"
        )


@router.get("/health")
async def admin_health():
    """Health check for admin endpoints."""
    return {"status": "ok", "module": "admin"}
