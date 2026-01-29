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
import base64

from app.services.replicate_ai_service import (
    ReplicateAIService, 
    get_replicate_service,
    ModelQuality,
    ProcessingResult
)
from app.services.r2_storage_service import R2StorageService, get_r2_storage

router = APIRouter(prefix="/ai", tags=["AI Processing"])


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
    Remove background from image.
    
    Uses RMBG-2.0 (premium) for best quality.
    Perfect edge detection, handles hair perfectly.
    
    Cost: ~$0.005/image
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
    Enhance face quality using CodeFormer.
    
    Best for low-quality selfies, restores natural skin texture.
    
    Parameters:
    - upscale: 1-4x output size
    - fidelity: 0.0 = max enhancement, 1.0 = preserve original
    
    Cost: ~$0.02/image
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
    Upscale image to 4K using Real-ESRGAN.
    
    Parameters:
    - scale: 2x or 4x
    - face_enhance: Apply GFPGAN face enhancement
    
    Cost: ~$0.01/image
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
    ai_service: ReplicateAIService = Depends(get_replicate_service)
):
    """
    Generate 3D face model from single photo using DECA.
    
    Returns:
    - 3D mesh (OBJ format)
    - Texture map
    - Shape and expression parameters
    
    Cost: ~$0.08/face
    """
    result = await ai_service.reconstruct_3d_face(
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

@router.get("/pricing")
async def get_pricing():
    """Get current pricing for AI operations."""
    return {
        "currency": "USD",
        "operations": {
            "background_removal": {
                "cost": 0.005,
                "description": "Remove background using RMBG-2.0",
                "quality": "Premium - perfect edges"
            },
            "face_enhancement": {
                "cost": 0.02,
                "description": "Enhance face using CodeFormer",
                "quality": "Premium - natural skin texture"
            },
            "upscale": {
                "cost": 0.01,
                "description": "4x upscale using Real-ESRGAN",
                "quality": "Premium - sharp 4K output"
            },
            "face_3d": {
                "cost": 0.08,
                "description": "3D reconstruction using DECA",
                "quality": "Premium - accurate geometry"
            },
            "full_pipeline": {
                "cost_with_3d": 0.12,
                "cost_without_3d": 0.04,
                "description": "Complete processing pipeline"
            }
        },
        "storage": {
            "cost_per_gb": 0.015,
            "description": "Cloudflare R2 storage"
        }
    }
