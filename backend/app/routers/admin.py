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


@router.post("/populate-ingredients")
async def populate_ingredients():
    """Populate ingredients table with initial data."""
    from app.database import SessionLocal
    
    ingredients_data = [
        ("Aqua", "7732-18-5", "231-791-2", "Solvent", "Approved", None, False, 0),
        ("Glycerin", "56-81-5", "200-289-5", "Humectant", "Approved", None, False, 0),
        ("Niacinamide", "98-92-0", "202-713-4", "Skin Conditioning", "Approved", None, False, 0),
        ("Hyaluronic Acid", "9067-32-7", "618-388-6", "Skin Conditioning", "Approved", None, False, 0),
        ("Retinol", "68-26-8", "200-683-7", "Skin Conditioning", "Approved", "Max 0.3%", False, 2)
    ]
    
    db = SessionLocal()
    try:
        inserted = 0
        for data in ingredients_data:
            # Check if ingredient already exists
            existing = db.execute(
                "SELECT id FROM ingredients WHERE inci_name = :name",
                {"name": data[0]}
            ).fetchone()
            
            if not existing:
                db.execute(
                    """INSERT INTO ingredients 
                       (inci_name, cas_number, ec_number, function, regulatory_status, 
                        restrictions, microbiome_risk_flag, comedogenicity_score, source)
                       VALUES (:inci, :cas, :ec, :func, :reg, :rest, :micro, :comed, 'manual')""",
                    {
                        "inci": data[0], "cas": data[1], "ec": data[2], "func": data[3],
                        "reg": data[4], "rest": data[5], "micro": data[6], "comed": data[7]
                    }
                )
                inserted += 1
        
        db.commit()
        logger.info(f"✅ Populated {inserted} ingredients")
        return {"status": "success", "inserted": inserted, "message": f"Populated {inserted} new ingredients"}
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to populate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
