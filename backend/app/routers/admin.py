"""Admin router for administrative operations."""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.models.product_models import Product
from app.models.saved_routine import SavedRoutine
from app.models.scan import ScanSession
from app.models.twin_models import SkinStateSnapshot
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class SeedResponse(BaseModel):
    """Response model for seed operations."""

    status: str
    message: str
    task_id: Optional[str] = None


class AdminSummary(BaseModel):
    user_count: int
    active_user_count: int
    scan_count: int
    product_count: int
    routine_count: int
    snapshot_count: int


class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: Optional[datetime] = None


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_verified: Optional[bool] = None


class AdminProductCreate(BaseModel):
    brand: str
    name: str
    category: str
    upc: Optional[str] = None
    price_usd: Optional[float] = None
    product_image_url: Optional[str] = None


class AdminProductUpdate(BaseModel):
    brand: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    upc: Optional[str] = None
    price_usd: Optional[float] = None
    product_image_url: Optional[str] = None


class AdminProductResponse(BaseModel):
    id: str
    brand: str
    name: str
    category: str
    upc: Optional[str] = None
    price_usd: Optional[float] = None
    product_image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@router.post("/seed-database", response_model=SeedResponse)
async def seed_database(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
):
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
                    check=True,
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
            message=(
                "Database seeding started in background. Check logs for progress. "
                "This may take several minutes to complete."
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start seeding: {str(e)}")


@router.get("/health")
async def health_check(current_user: User = Depends(get_current_admin)):
    """Health check endpoint."""
    return {"status": "healthy", "service": "admin"}


@router.post("/populate-ingredients")
async def populate_ingredients(current_user: User = Depends(get_current_admin)):
    """Populate ingredients table with initial data."""
    from app.database import SessionLocal

    ingredients_data = [
        ("Aqua", "7732-18-5", "231-791-2", "Solvent", "Approved", None, False, 0),
        ("Glycerin", "56-81-5", "200-289-5", "Humectant", "Approved", None, False, 0),
        ("Niacinamide", "98-92-0", "202-713-4", "Skin Conditioning", "Approved", None, False, 0),
        ("Hyaluronic Acid", "9067-32-7", "618-388-6", "Skin Conditioning", "Approved", None, False, 0),
        ("Retinol", "68-26-8", "200-683-7", "Skin Conditioning", "Approved", "Max 0.3%", False, 2),
    ]

    db = SessionLocal()
    try:
        inserted = 0

        for data in ingredients_data:
            # Check if ingredient already exists
            existing = (
                db.execute(
                    text("SELECT id FROM ingredients WHERE inci_name = :name"),
                    {"name": data[0]},
                )
                .fetchone()
            )

            if not existing:
                db.execute(
                    text(
                        """
                        INSERT INTO ingredients
                            (inci_name, cas_number, ec_number, function, regulatory_status,
                             restrictions, microbiome_risk_flag, comedogenicity_score, source)
                        VALUES
                            (:inci, :cas, :ec, :func, :reg, :rest, :micro, :comed, 'manual')
                        """
                    ),
                    {
                        "inci": data[0],
                        "cas": data[1],
                        "ec": data[2],
                        "func": data[3],
                        "reg": data[4],
                        "rest": data[5],
                        "micro": data[6],
                        "comed": data[7],
                    },
                )
                inserted += 1

        db.commit()
        logger.info(f"✅ Populated {inserted} ingredients")
        return {
            "status": "success",
            "inserted": inserted,
            "message": f"Populated {inserted} new ingredients",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to populate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/upload-scin-data")
async def upload_scin_data(samples: dict, current_user: User = Depends(get_current_admin)):
    """Upload SCIN dataset samples to PostgreSQL."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        # Create scin_samples table if it doesn't exist
        create_table_sql = text(
            """
            CREATE TABLE IF NOT EXISTS scin_samples (
                id SERIAL PRIMARY KEY,
                case_id VARCHAR(255) UNIQUE,
                source VARCHAR(100),
                year INTEGER,
                age_group VARCHAR(50),
                sex_at_birth VARCHAR(50),
                fitzpatrick_skin_type VARCHAR(50),
                monk_skin_tone_india INTEGER,
                monk_skin_tone_us INTEGER,
                dermatologist_fst_label VARCHAR(50),
                image_1_path TEXT,
                image_1_shot_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        db.execute(create_table_sql)
        db.commit()

        # Insert samples
        samples_list = samples.get("samples", [])
        inserted = 0

        for sample in samples_list:
            try:
                # Check if sample already exists
                existing = (
                    db.execute(
                        text("SELECT id FROM scin_samples WHERE case_id = :case_id"),
                        {"case_id": sample.get("case_id")},
                    )
                    .fetchone()
                )

                if not existing:
                    db.execute(
                        text(
                            """
                            INSERT INTO scin_samples
                                (case_id, source, year, age_group, sex_at_birth,
                                 fitzpatrick_skin_type, monk_skin_tone_india, monk_skin_tone_us,
                                 dermatologist_fst_label, image_1_path, image_1_shot_type)
                            VALUES
                                (:case_id, :source, :year, :age_group, :sex_at_birth,
                                 :fitzpatrick_skin_type, :monk_skin_tone_india, :monk_skin_tone_us,
                                 :dermatologist_fst_label, :image_1_path, :image_1_shot_type)
                            """
                        ),
                        {
                            "case_id": sample.get("case_id"),
                            "source": sample.get("source", "SCIN"),
                            "year": sample.get("year"),
                            "age_group": sample.get("age_group"),
                            "sex_at_birth": sample.get("sex_at_birth"),
                            "fitzpatrick_skin_type": sample.get("fitzpatrick_skin_type"),
                            "monk_skin_tone_india": sample.get("monk_skin_tone_india"),
                            "monk_skin_tone_us": sample.get("monk_skin_tone_us"),
                            "dermatologist_fst_label": sample.get("dermatologist_fst_label"),
                            "image_1_path": sample.get("image_1_path"),
                            "image_1_shot_type": sample.get("image_1_shot_type"),
                        },
                    )
                    inserted += 1
            except Exception as e:
                logger.error(f"Error inserting sample {sample.get('case_id')}: {str(e)}")
                continue

        db.commit()
        logger.info(f"✅ Uploaded {inserted} SCIN samples")
        return {
            "status": "success",
            "inserted": inserted,
            "total_received": len(samples_list),
            "message": f"Successfully uploaded {inserted} samples",
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to upload SCIN data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/import-scin")
async def import_scin(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
):
    """Import SCIN dataset from HuggingFace to PostgreSQL.

    Downloads skin samples in streaming mode and inserts
    into scin_samples table in batches to avoid RAM issues.
    """
    try:
        def run_import_script():
            try:
                logger.info("Starting SCIN dataset import via import_scin.py script...")

                # Get path to import_scin.py script
                script_path = Path("/app/backend/scripts/import_scin.py")
                if not script_path.exists():
                    logger.error(f"Import script not found at: {script_path}")
                    return

                # Run the script
                result = subprocess.run(
                    [sys.executable, str(script_path)],
                    capture_output=True,
                    text=True,
                    check=True,
                )

                logger.info(f"Import script output:\n{result.stdout}")
                if result.stderr:
                    logger.warning(f"Import script warnings:\n{result.stderr}")

                logger.info("✅ SCIN import completed successfully!")

            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Import script failed with exit code {e.returncode}")
                logger.error(f"stdout: {e.stdout}")
                logger.error(f"stderr: {e.stderr}")
            except Exception as e:
                logger.error(f"❌ Import failed: {str(e)}", exc_info=True)

        # Schedule background task
        background_tasks.add_task(run_import_script)

        return {
            "status": "started",
            "message": (
                "SCIN dataset import started in background. This will download samples "
                "from HuggingFace and insert into PostgreSQL. Check logs for progress."
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start SCIN import: {str(e)}")


@router.get("/summary", response_model=AdminSummary)
async def get_admin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_count = db.query(User).count()
    active_user_count = db.query(User).filter(User.is_active == True).count()
    scan_count = db.query(ScanSession).count()
    product_count = db.query(Product).count()
    routine_count = db.query(SavedRoutine).count()
    snapshot_count = db.query(SkinStateSnapshot).count()
    return AdminSummary(
        user_count=user_count,
        active_user_count=active_user_count,
        scan_count=scan_count,
        product_count=product_count,
        routine_count=routine_count,
        snapshot_count=snapshot_count,
    )


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = db.query(User)
    if search:
        like = f"%{search.strip().lower()}%"
        query = query.filter(
            (User.email.ilike(like)) | (User.full_name.ilike(like))
        )
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [
        AdminUserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            created_at=user.created_at,
        )
        for user in users
    ]


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        created_at=user.created_at,
    )


@router.get("/products", response_model=list[AdminProductResponse])
async def list_products(
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = db.query(Product)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(like)) | (Product.brand.ilike(like))
        )
    items = query.order_by(Product.created_at.desc()).offset(offset).limit(limit).all()
    return [
        AdminProductResponse(
            id=str(item.id),
            brand=item.brand,
            name=item.name,
            category=item.category,
            upc=item.upc,
            price_usd=item.price_usd,
            product_image_url=item.product_image_url,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]


@router.post("/products", response_model=AdminProductResponse, status_code=201)
async def create_product(
    payload: AdminProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    product = Product(
        brand=payload.brand,
        name=payload.name,
        category=payload.category,
        upc=payload.upc,
        price_usd=payload.price_usd,
        product_image_url=payload.product_image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return AdminProductResponse(
        id=str(product.id),
        brand=product.brand,
        name=product.name,
        category=product.category,
        upc=product.upc,
        price_usd=product.price_usd,
        product_image_url=product.product_image_url,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.patch("/products/{product_id}", response_model=AdminProductResponse)
async def update_product(
    product_id: str,
    payload: AdminProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return AdminProductResponse(
        id=str(product.id),
        brand=product.brand,
        name=product.name,
        category=product.category,
        upc=product.upc,
        price_usd=product.price_usd,
        product_image_url=product.product_image_url,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None
