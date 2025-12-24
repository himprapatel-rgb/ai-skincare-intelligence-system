from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import uuid

# Internal imports
from app.core import skin_analysis as models
from app.schemas import analysis_schemas as schemas
from app.database import get_db
from services.ml_engine import analyze_skin_image

router = APIRouter(prefix="/analysis", tags=["Skin Analysis"])

@router.post("/", response_model=schemas.AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_skin_analysis(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_user)  # Assuming Auth is ready
):
    # 1. Validate File Type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG are supported."
        )
    
    try:
        # 2. Process Image (Read bytes)
        image_bytes = await file.read()
        
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
        raise HTTPException(
            status_code=500,
            detail="An error occurred during skin analysis processing."
        )

        # Add recommendation endpoint
from services import recommendation as rec_service

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