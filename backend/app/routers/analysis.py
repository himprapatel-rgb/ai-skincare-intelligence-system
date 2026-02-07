import io
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image
from sqlalchemy.orm import Session

# Internal imports
from app.core import skin_analysis as models
from app.database import get_db
from app.schemas import analysis_schemas as schemas
from services.ml_engine import analyze_skin_image
from services import recommendation as rec_service

router = APIRouter(prefix="/analysis", tags=["Skin Analysis"])
logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png"}
MAX_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB
MAX_IMAGE_DIMENSION = 4096


async def _validate_image_upload(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG are supported.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Image too large. Maximum size is 4 MB.",
        )
    if len(image_bytes) < 64:
        raise HTTPException(
            status_code=400,
            detail="Invalid image data.",
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            w, h = img.size
            if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions too large.",
                )
            img.verify()
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Image validation failed: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file.",
        )

    return image_bytes
@router.post("/", response_model=schemas.AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_skin_analysis(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_user)  # Assuming Auth is ready
):
    try:
        # 1. Validate image
        image_bytes = await _validate_image_upload(file)

        # 3. Call ML Engine
        # This function should handle resizing, normalization, and model inference
        analysis_result = analyze_skin_image(image_bytes)
        
        # 4. Save Image to Cloud Storage (Mocked here as a local path/URL)
        # In production, use a utility to upload to AWS S3 or Cloudinary
        file_url = f"https://storage.yoursystem.com/uploads/{uuid.uuid4()}.jpg"
        
        # 5. Persist to PostgreSQL
        new_analysis = models.SkinAnalysis(
            user_id=1,  # Replace with current_user.id
            image_url=file_url,
            skin_type=analysis_result["skin_type"],
            concerns=analysis_result["concerns"],
            confidence_score=analysis_result["confidence"]
        )
        
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)
        
        return new_analysis
    
    except Exception as e:
        # Log the error (e.g., Sentry)
        logger.error("Analysis error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during skin analysis processing."
        )

@router.get("/{analysis_id}/recommendations", response_model=List[schemas.AnalysisResponse])
def get_analysis_recommendations(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    products = rec_service.get_recommended_products(db, analysis_id)
    
    if not products:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found or no products match your profile."
        )
    
    return products