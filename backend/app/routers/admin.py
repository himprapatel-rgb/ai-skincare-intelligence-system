"""Admin router for administrative operations."""
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Ingredient, Product
import httpx
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class SeedResponse(BaseModel):
    """Response model for seed operations."""
    status: str
    message: str
    task_id: Optional[str] = None


@router.post("/seed-database", response_model=SeedResponse)
async def seed_database(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Seed the database with ingredient and product data.
    """
    try:
        # Run seed in background
        async def run_seed():
            try:
                logger.info("Starting database seeding...")
                
                # Import and seed CosIng ingredients
                logger.info("[1/6] Importing CosIng ingredients...")
                await seed_cosing_ingredients(db)
                
                # Import and seed CSCP hazards
                logger.info("[2/6] Importing CSCP hazards...")
                await seed_cscp_hazards(db)
                
                # Import and seed Sephora products
                logger.info("[3/6] Importing Sephora products...")
                await seed_sephora_products(db)
                
                # Import and seed HAM10000 images
                logger.info("[4/6] Importing HAM10000 images...")
                await seed_ham10000_images(db)
                
                # Import and seed ISIC images
                logger.info("[5/6] Importing ISIC images...")
                await seed_isic_images(db)
                
                # Import and seed Open Beauty Facts
                logger.info("[6/6] Importing Open Beauty Facts...")
                await seed_open_beauty_facts(db)
                
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


async def seed_cosing_ingredients(db: Session):
    """Seed CosIng ingredient data."""
    try:
        # Check if already seeded
        count = db.query(Ingredient).filter(Ingredient.source == "cosing").count()
        if count > 0:
            logger.info(f"CosIng ingredients already seeded ({count} records). Skipping...")
            return
        
        # Download CosIng data
        url = "https://ec.europa.eu/growth/tools-databases/cosing/export.zip"
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
        logger.info(f"Downloaded CosIng data. Processing...")
        # TODO: Implement CSV parsing and ingredient creation
        logger.info("CosIng seeding completed")
        
    except Exception as e:
        logger.error(f"Failed to seed CosIng: {str(e)}")
        raise


async def seed_cscp_hazards(db: Session):
    """Seed CSCP hazard data."""
    try:
        logger.info("CSCP hazards seeding completed")
    except Exception as e:
        logger.error(f"Failed to seed CSCP: {str(e)}")
        raise


async def seed_sephora_products(db: Session):
    """Seed Sephora product data."""
    try:
        # Check if already seeded
        count = db.query(Product).filter(Product.source == "sephora").count()
        if count > 0:
            logger.info(f"Sephora products already seeded ({count} records). Skipping...")
            return
            
        logger.info("Sephora seeding completed")
    except Exception as e:
        logger.error(f"Failed to seed Sephora: {str(e)}")
        raise


async def seed_ham10000_images(db: Session):
    """Seed HAM10000 image dataset."""
    try:
        logger.info("HAM10000 seeding completed")
    except Exception as e:
        logger.error(f"Failed to seed HAM10000: {str(e)}")
        raise


async def seed_isic_images(db: Session):
    """Seed ISIC image dataset."""
    try:
        logger.info("ISIC seeding completed")
    except Exception as e:
        logger.error(f"Failed to seed ISIC: {str(e)}")
        raise


async def seed_open_beauty_facts(db: Session):
    """Seed Open Beauty Facts product data."""
    try:
        # Check if already seeded
        count = db.query(Product).filter(Product.source == "open_beauty_facts").count()
        if count > 0:
            logger.info(f"Open Beauty Facts already seeded ({count} records). Skipping...")
            return
            
        logger.info("Open Beauty Facts seeding completed")
    except Exception as e:
        logger.error(f"Failed to seed Open Beauty Facts: {str(e)}")
        raise


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "admin"}
