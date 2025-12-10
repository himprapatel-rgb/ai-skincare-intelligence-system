"""Admin router for administrative operations."""
import subprocess
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

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
    
    This endpoint runs the seed_database.py script that populates
    the database with all training datasets (CosIng, CSCP, OBF, etc.).
    """
    try:
        # Run seed script in background
        async def run_seed():
            process = await asyncio.create_subprocess_exec(
                "python", "backend/scripts/seed_database.py",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode != 0:
                print(f"Seed failed: {stderr.decode()}")
            else:
                print(f"Seed success: {stdout.decode()}")
        
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
