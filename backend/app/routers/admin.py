"""Admin router for administrative operations."""
import logging
import subprocess
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

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
    Seed the database with ingredient and product data.
    
    This endpoint triggers the seed_database.py script which imports all
    data sources (CosIng, CSCP, Sephora, HAM10000, ISIC, Open Beauty Facts).
    """
    try:
        # Run seed in background using subprocess
        def run_seed_script():
            try:
                logger.info("Starting database seeding via seed_database.py script...")
                
                # Get path to seed_database.py script
                script_path = Path("/app/backend/scripts/seed_database.py")
                if not script_path.exists():
                    logger.error(f"Seed script not found at: {script_path}")
                    return
                
                # Run the script using the Python interpreter
                result = subprocess.run(
                    [sys.executable, str(script_path)],
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                logger.info(f"Seed script output:\n{result.stdout}")
                if result.stderr:
                    logger.warning(f"Seed script warnings:\n{result.stderr}")
                    
                logger.info("✅ Database seeding completed successfully!")
                
            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Seed script failed with exit code {e.returncode}")
                logger.error(f"stdout: {e.stdout}")
                logger.error(f"stderr: {e.stderr}")
            except Exception as e:
                logger.error(f"❌ Seed failed: {str(e)}", exc_info=True)
        
        # Schedule background task
        background_tasks.add_task(run_seed_script)
        
        return SeedResponse(
            status="started",
            message="Database seeding started in background. Check logs for progress. This may take several minutes to complete."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start seeding: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "admin"}
