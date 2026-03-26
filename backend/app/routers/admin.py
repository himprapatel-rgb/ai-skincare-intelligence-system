"""Admin router for administrative operations."""

import logging
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from pydantic import BaseModel
from sqlalchemy import func as sqlfunc, text
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import get_current_admin
from app.database import get_db, engine
from app.models.content import Blog, NewsItem, Video
from app.models.product_models import Product
from app.models.saved_routine import SavedRoutine
from app.models.scan import ScanSession
from app.models.twin_models import SkinStateSnapshot
from app.models.user import User, UserAccessLog
from app.schemas.content_schemas import (
    BlogCreate,
    BlogResponse,
    BlogUpdate,
    NewsCreate,
    NewsResponse,
    NewsUpdate,
    VideoCreate,
    VideoResponse,
    VideoUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# Upload directory for admin images (blog covers, video thumbnails)
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


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
    # Single query with subselects instead of 6 sequential COUNT queries
    row = db.execute(text("""
        SELECT
            (SELECT count(*) FROM users) AS user_count,
            (SELECT count(*) FROM users WHERE is_active = true) AS active_user_count,
            (SELECT count(*) FROM scan_sessions) AS scan_count,
            (SELECT count(*) FROM products) AS product_count,
            (SELECT count(*) FROM saved_routines) AS routine_count,
            (SELECT count(*) FROM skin_state_snapshots) AS snapshot_count
    """)).fetchone()
    return AdminSummary(
        user_count=row[0],
        active_user_count=row[1],
        scan_count=row[2],
        product_count=row[3],
        routine_count=row[4],
        snapshot_count=row[5],
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


# --- Image Upload ---

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
):
    """Upload an image (blog cover, video thumbnail). Returns URL for use in cover_image_url or thumbnail_url."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, detail="Allowed types: JPEG, PNG, WebP, GIF")
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(400, detail="Max file size 5MB")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ext = "jpg" if file.content_type == "image/jpeg" else "png" if file.content_type == "image/png" else "webp" if file.content_type == "image/webp" else "gif"
    name = f"{datetime.utcnow().strftime('%Y%m%d')}_{datetime.utcnow().timestamp():.0f}_{current_user.id}.{ext}"
    path = UPLOADS_DIR / name
    path.write_bytes(contents)
    return {"url": f"/uploads/{name}"}


# --- Content (Blogs, Videos, News) ---

def _slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", s).strip("-")[:80]


# Blogs
@router.get("/blogs", response_model=List[BlogResponse])
def admin_list_blogs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    items = db.query(Blog).order_by(Blog.sort_order.asc(), Blog.created_at.desc()).offset(offset).limit(limit).all()
    return items


@router.post("/blogs", response_model=BlogResponse, status_code=201)
def admin_create_blog(
    payload: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    slug = payload.slug or _slugify(payload.title)
    blog = Blog(
        title=payload.title,
        slug=slug,
        excerpt=payload.excerpt,
        content=payload.content,
        cover_image_url=payload.cover_image_url,
        read_time_min=payload.read_time_min,
        published=payload.published,
        published_at=payload.published_at,
        sort_order=payload.sort_order,
    )
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return blog


@router.patch("/blogs/{blog_id}", response_model=BlogResponse)
def admin_update_blog(
    blog_id: int,
    payload: BlogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and "slug" not in data:
        data["slug"] = _slugify(data["title"])
    for k, v in data.items():
        setattr(blog, k, v)
    db.commit()
    db.refresh(blog)
    return blog


@router.delete("/blogs/{blog_id}", status_code=204)
def admin_delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(blog)
    db.commit()
    return None


# Videos
@router.get("/videos", response_model=List[VideoResponse])
def admin_list_videos(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    items = db.query(Video).order_by(Video.sort_order.asc(), Video.created_at.desc()).offset(offset).limit(limit).all()
    return items


@router.post("/videos", response_model=VideoResponse, status_code=201)
def admin_create_video(
    payload: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    video = Video(
        title=payload.title,
        description=payload.description,
        video_url=payload.video_url,
        thumbnail_url=payload.thumbnail_url,
        duration_sec=payload.duration_sec,
        difficulty=payload.difficulty,
        published=payload.published,
        sort_order=payload.sort_order,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


@router.patch("/videos/{video_id}", response_model=VideoResponse)
def admin_update_video(
    video_id: int,
    payload: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(video, k, v)
    db.commit()
    db.refresh(video)
    return video


@router.delete("/videos/{video_id}", status_code=204)
def admin_delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(video)
    db.commit()
    return None


# News
@router.get("/news", response_model=List[NewsResponse])
def admin_list_news(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    items = (
        db.query(NewsItem)
        .order_by(NewsItem.sort_order.asc(), NewsItem.published_at.desc().nullslast(), NewsItem.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items


@router.post("/news", response_model=NewsResponse, status_code=201)
def admin_create_news(
    payload: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    news = NewsItem(
        title=payload.title,
        body=payload.body,
        link_url=payload.link_url,
        is_featured=payload.is_featured,
        published=payload.published,
        published_at=payload.published_at,
        sort_order=payload.sort_order,
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return news


@router.patch("/news/{news_id}", response_model=NewsResponse)
def admin_update_news(
    news_id: int,
    payload: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    news = db.query(NewsItem).filter(NewsItem.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(news, k, v)
    db.commit()
    db.refresh(news)
    return news


@router.delete("/news/{news_id}", status_code=204)
def admin_delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    news = db.query(NewsItem).filter(NewsItem.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News item not found")
    db.delete(news)
    db.commit()
    return None


# --- Audit Log ---

class AuditLogEntry(BaseModel):
    id: int
    user_id: int
    ip_address: str
    geolocation: Optional[dict] = None
    created_at: Optional[datetime] = None


@router.get("/audit-log", response_model=list[AuditLogEntry])
async def get_audit_log(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Return paginated user access log entries (audit trail)."""
    query = db.query(UserAccessLog)
    if user_id is not None:
        query = query.filter(UserAccessLog.user_id == user_id)
    logs = (
        query.order_by(UserAccessLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        AuditLogEntry(
            id=log.id,
            user_id=log.user_id,
            ip_address=log.ip_address,
            geolocation=log.geolocation,
            created_at=log.created_at,
        )
        for log in logs
    ]


# --- System Health (detailed) ---

@router.get("/system/health")
async def system_health(
    current_user: User = Depends(get_current_admin),
):
    """
    Detailed system health: DB pool stats, Redis connectivity, OpenAI key check.
    """
    import time

    health: dict = {"status": "ok", "checks": {}}

    # DB pool stats
    try:
        pool = engine.pool
        health["checks"]["database"] = {
            "status": "ok",
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }
    except Exception as exc:
        health["checks"]["database"] = {"status": "error", "detail": str(exc)[:200]}
        health["status"] = "degraded"

    # Redis connectivity
    redis_url = settings.REDIS_URL
    if redis_url:
        try:
            import redis
            start = time.time()
            r = redis.from_url(redis_url, socket_connect_timeout=3)
            r.ping()
            latency = int((time.time() - start) * 1000)
            health["checks"]["redis"] = {"status": "ok", "latency_ms": latency}
        except Exception as exc:
            health["checks"]["redis"] = {"status": "error", "detail": str(exc)[:200]}
            health["status"] = "degraded"
    else:
        health["checks"]["redis"] = {"status": "not_configured"}

    # OpenAI key check (non-empty, starts with sk-)
    openai_key = settings.OPENAI_API_KEY
    if openai_key and openai_key.startswith("sk-"):
        health["checks"]["openai"] = {"status": "ok", "key_prefix": openai_key[:7] + "..."}
    elif openai_key:
        health["checks"]["openai"] = {"status": "warning", "detail": "Key present but unexpected format"}
    else:
        health["checks"]["openai"] = {"status": "not_configured"}

    return health
