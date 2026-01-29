"""
AI Processing API Router

Premium AI endpoints for:
1. Background Removal
2. Face Enhancement
3. Image Upscaling
4. 3D Face Reconstruction
5. Full Pipeline Processing

All endpoints use best-in-class models via Replicate.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl
from typing import Optional
from enum import Enum
from sqlalchemy.orm import Session
import base64

from app.services.replicate_ai_service import (
    ReplicateAIService, 
    get_replicate_service,
    ModelQuality,
    ProcessingResult
)
from app.services.r2_storage_service import R2StorageService, get_r2_storage
from app.services.usage_limits_service import (
    UsageLimitsService,
    get_usage_service,
    FeatureType
)
from app.database import get_db
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/ai", tags=["AI Processing"])


# ============== Dependency for optional auth ==============

async def get_current_user_id_optional(
    current_user = Depends(get_current_user_optional)
) -> Optional[int]:
    """Get current user ID or None for guests."""
    if current_user:
        return current_user.id
    return None


# ============== Request/Response Models ==============

class QualityLevel(str, Enum):
    fast = "fast"
    balanced = "balanced"
    premium = "premium"


class ImageProcessRequest(BaseModel):
    image_url: HttpUrl
    quality: QualityLevel = QualityLevel.premium


class BackgroundRemovalRequest(ImageProcessRequest):
    pass


class FaceEnhancementRequest(ImageProcessRequest):
    upscale: int = 2
    fidelity: float = 0.7  # 0=max enhance, 1=preserve original


class UpscaleRequest(ImageProcessRequest):
    scale: int = 4
    face_enhance: bool = True


class Face3DRequest(ImageProcessRequest):
    pass


class FullPipelineRequest(ImageProcessRequest):
    include_3d: bool = True
    save_to_storage: bool = True
    user_id: Optional[str] = None


class ProcessingResponse(BaseModel):
    success: bool
    output_url: Optional[str] = None
    cost_estimate: float = 0.0
    model_used: Optional[str] = None
    error: Optional[str] = None


class FullPipelineResponse(BaseModel):
    success: bool
    total_cost: float
    final_image_url: Optional[str] = None
    background_removed_url: Optional[str] = None
    enhanced_url: Optional[str] = None
    upscaled_url: Optional[str] = None
    face_3d_url: Optional[str] = None
    storage_urls: Optional[dict] = None
    error: Optional[str] = None


# ============== Helper Functions ==============

def quality_to_enum(quality: QualityLevel) -> ModelQuality:
    """Convert API quality level to service enum."""
    mapping = {
        QualityLevel.fast: ModelQuality.FAST,
        QualityLevel.balanced: ModelQuality.BALANCED,
        QualityLevel.premium: ModelQuality.PREMIUM,
    }
    return mapping[quality]


# ============== API Endpoints ==============

@router.post("/remove-background", response_model=ProcessingResponse)
async def remove_background(
    request: BackgroundRemovalRequest,
    ai_service: ReplicateAIService = Depends(get_replicate_service)
):
    """
    Remove background from image (INTERNAL processing).
    
    This is used internally to improve scan quality.
    No rate limits - runs automatically as part of analysis pipeline.
    
    Uses RMBG-2.0 for best quality edge detection.
    """
    result = await ai_service.remove_background(
        image_url=str(request.image_url),
        quality=quality_to_enum(request.quality)
    )
    
    return ProcessingResponse(
        success=result.success,
        output_url=result.output_url,
        cost_estimate=result.cost_estimate,
        model_used=result.model_used,
        error=result.error
    )


@router.post("/enhance-face", response_model=ProcessingResponse)
async def enhance_face(
    request: FaceEnhancementRequest,
    ai_service: ReplicateAIService = Depends(get_replicate_service)
):
    """
    Enhance face quality using CodeFormer (INTERNAL processing).
    
    This is used internally to improve scan quality.
    No rate limits - runs automatically as part of analysis pipeline.
    
    Parameters:
    - upscale: 1-4x output size
    - fidelity: 0.0 = max enhancement, 1.0 = preserve original
    """
    result = await ai_service.enhance_face(
        image_url=str(request.image_url),
        quality=quality_to_enum(request.quality),
        upscale=request.upscale,
        codeformer_fidelity=request.fidelity
    )
    
    return ProcessingResponse(
        success=result.success,
        output_url=result.output_url,
        cost_estimate=result.cost_estimate,
        model_used=result.model_used,
        error=result.error
    )


@router.post("/upscale", response_model=ProcessingResponse)
async def upscale_image(
    request: UpscaleRequest,
    ai_service: ReplicateAIService = Depends(get_replicate_service)
):
    """
    Upscale image to 4K using Real-ESRGAN (INTERNAL processing).
    
    This is used internally to improve scan quality.
    No rate limits - runs automatically as part of analysis pipeline.
    
    Parameters:
    - scale: 2x or 4x
    - face_enhance: Apply GFPGAN face enhancement
    """
    result = await ai_service.upscale_image(
        image_url=str(request.image_url),
        scale=request.scale,
        quality=quality_to_enum(request.quality),
        face_enhance=request.face_enhance
    )
    
    return ProcessingResponse(
        success=result.success,
        output_url=result.output_url,
        cost_estimate=result.cost_estimate,
        model_used=result.model_used,
        error=result.error
    )


@router.post("/reconstruct-3d", response_model=ProcessingResponse)
async def reconstruct_3d_face(
    request: Face3DRequest,
    user_id: Optional[int] = Depends(get_current_user_id_optional),
    db: Session = Depends(get_db),
    ai_service: ReplicateAIService = Depends(get_replicate_service)
):
    """
    Generate 3D face model from single photo using DECA.
    
    **Requires login** - Free users get 1/day.
    
    Returns:
    - 3D mesh (OBJ format)
    - Texture map
    - Shape and expression parameters
    """
    # Check usage limit
    usage_service = get_usage_service(db)
    can_use, message = usage_service.check_limit(user_id, FeatureType.FACE_3D)
    
    if not can_use:
        raise HTTPException(status_code=403, detail=message)
    
    result = await ai_service.reconstruct_3d_face(
        image_url=str(request.image_url),
        quality=quality_to_enum(request.quality)
    )
    
    # Record usage if successful
    if result.success and user_id:
        usage_service.record_usage(user_id, FeatureType.FACE_3D)
    
    return ProcessingResponse(
        success=result.success,
        output_url=result.output_url,
        cost_estimate=result.cost_estimate,
        model_used=result.model_used,
        error=result.error
    )


@router.post("/full-pipeline", response_model=FullPipelineResponse)
async def full_pipeline(
    request: FullPipelineRequest,
    ai_service: ReplicateAIService = Depends(get_replicate_service),
    storage: R2StorageService = Depends(get_r2_storage)
):
    """
    Run full premium AI pipeline:
    
    1. Remove background (RMBG-2.0)
    2. Enhance face (CodeFormer)
    3. Upscale to 4K (Real-ESRGAN)
    4. Generate 3D model (DECA) - optional
    5. Save to Cloudflare R2 - optional
    
    Total cost: ~$0.12/image (with 3D) or ~$0.04/image (without)
    """
    try:
        results = await ai_service.full_pipeline(
            image_url=str(request.image_url),
            quality=quality_to_enum(request.quality),
            include_3d=request.include_3d
        )
        
        if not results["success"]:
            return FullPipelineResponse(
                success=False,
                total_cost=results["total_cost"],
                error="Pipeline failed at one of the steps"
            )
        
        response = FullPipelineResponse(
            success=True,
            total_cost=results["total_cost"],
            final_image_url=results.get("final_image"),
        )
        
        # Extract step URLs
        steps = results.get("steps", {})
        if "background_removal" in steps:
            response.background_removed_url = steps["background_removal"].output_url
        if "face_enhancement" in steps:
            response.enhanced_url = steps["face_enhancement"].output_url
        if "upscale" in steps:
            response.upscaled_url = steps["upscale"].output_url
        if "face_3d" in steps:
            response.face_3d_url = steps["face_3d"].output_url
        
        # Save to storage if requested
        if request.save_to_storage and request.user_id:
            storage_results = {}
            
            # Save final image
            if response.final_image_url:
                img_result = await storage.upload_from_url(
                    source_url=response.final_image_url,
                    user_id=request.user_id,
                    category="enhanced",
                    filename="enhanced.png"
                )
                if img_result.success:
                    storage_results["enhanced_image"] = img_result.url
            
            # Save background-removed image
            if response.background_removed_url:
                bg_result = await storage.upload_from_url(
                    source_url=response.background_removed_url,
                    user_id=request.user_id,
                    category="backgrounds",
                    filename="no_background.png"
                )
                if bg_result.success:
                    storage_results["background_removed"] = bg_result.url
            
            response.storage_urls = storage_results
        
        return response
        
    except Exception as e:
        return FullPipelineResponse(
            success=False,
            total_cost=0,
            error=str(e)
        )


@router.post("/upload-and-process")
async def upload_and_process(
    file: UploadFile = File(...),
    quality: QualityLevel = Form(QualityLevel.premium),
    include_3d: bool = Form(True),
    user_id: Optional[str] = Form(None),
    ai_service: ReplicateAIService = Depends(get_replicate_service),
    storage: R2StorageService = Depends(get_r2_storage)
):
    """
    Upload image file and run full pipeline.
    
    Accepts: JPG, PNG, WebP
    Max size: 10MB
    
    Process:
    1. Upload original to R2
    2. Run full AI pipeline
    3. Save results to R2
    4. Return all URLs
    """
    # Validate file
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPG, PNG, WebP images are supported")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(400, "File too large. Max 10MB")
    
    # Upload original to storage first
    original_result = await storage.upload_file(
        file_data=content,
        user_id=user_id or "anonymous",
        category="originals",
        filename=file.filename or "upload.png",
        content_type=file.content_type
    )
    
    if not original_result.success:
        raise HTTPException(500, f"Failed to upload: {original_result.error}")
    
    # Run full pipeline
    pipeline_request = FullPipelineRequest(
        image_url=original_result.url,
        quality=quality,
        include_3d=include_3d,
        save_to_storage=True,
        user_id=user_id or "anonymous"
    )
    
    return await full_pipeline(pipeline_request, ai_service, storage)


# ============== Cost Estimation ==============

@router.get("/usage")
async def get_usage_limits(
    user_id: Optional[int] = Depends(get_current_user_id_optional),
    db: Session = Depends(get_db)
):
    """
    Get current usage limits and remaining uses for all features.
    
    Returns tier info and remaining daily uses for each premium feature.
    """
    usage_service = get_usage_service(db)
    return usage_service.get_limits_info(user_id)


@router.get("/pricing")
async def get_pricing(
    user_id: Optional[int] = Depends(get_current_user_id_optional),
    db: Session = Depends(get_db)
):
    """Get current pricing and usage limits for AI operations."""
    usage_service = get_usage_service(db)
    limits_info = usage_service.get_limits_info(user_id)
    
    # Get 3D face remaining (only premium feature with limits)
    face_3d_remaining = limits_info["features"].get("face_3d", {}).get("remaining", 0)
    
    return {
        "currency": "USD",
        "user_tier": limits_info["tier"],
        "is_premium": limits_info["is_premium"],
        "premium_features": {
            "face_3d": {
                "name": "3D Face Model",
                "description": "Interactive 3D reconstruction of your face",
                "requires_login": True,
                "free_daily_limit": 1,
                "remaining_today": face_3d_remaining,
                "available": face_3d_remaining > 0 or limits_info["is_premium"]
            }
        },
        "internal_processing": {
            "note": "These run automatically to improve your scan quality - no limits!",
            "features": [
                "Background removal for cleaner analysis",
                "Face enhancement for better detection",
                "Image upscaling for higher accuracy"
            ]
        },
        "tiers": {
            "guest": {
                "name": "Guest",
                "price": "Free",
                "features": [
                    "Basic skin scan with AI analysis",
                    "Skin condition detection",
                    "Product recommendations",
                    "Enhanced image processing (automatic)"
                ],
                "limitations": [
                    "No 3D face model",
                    "No history saved",
                    "No progress tracking"
                ]
            },
            "free": {
                "name": "Free Account",
                "price": "Free (login required)",
                "features": [
                    "Everything in Guest",
                    "1x 3D face model per day",
                    "Scan history saved forever",
                    "Progress tracking over time",
                    "Compare before/after"
                ],
                "limitations": [
                    "1 3D face model per day"
                ]
            },
            "premium": {
                "name": "Premium",
                "price": "Coming Soon",
                "features": [
                    "Unlimited 3D face models",
                    "Priority processing",
                    "Export 3D models",
                    "API access"
                ],
                "limitations": []
            }
        }
    }
