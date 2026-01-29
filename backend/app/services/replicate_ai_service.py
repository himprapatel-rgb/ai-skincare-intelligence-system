"""
Replicate AI Service - Premium Quality Models

This service provides access to the best AI models for:
1. Background Removal (RMBG-2.0)
2. Face Enhancement (CodeFormer + GFPGAN)
3. Image Upscaling (Real-ESRGAN)
4. 3D Face Reconstruction (DECA)

Cost per full pipeline: ~$0.12/image
"""

import os
import base64
import httpx
import replicate
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from app.config import settings


class ModelQuality(Enum):
    """Quality presets for different use cases"""
    FAST = "fast"        # Cheaper, good quality
    BALANCED = "balanced"  # Best value
    PREMIUM = "premium"   # Maximum quality


@dataclass
class ProcessingResult:
    """Result from AI processing"""
    success: bool
    output_url: Optional[str] = None
    output_data: Optional[bytes] = None
    model_used: Optional[str] = None
    cost_estimate: float = 0.0
    error: Optional[str] = None


class ReplicateAIService:
    """
    Premium AI processing using Replicate's best models.
    
    Models used:
    - Background: lucataco/rmbg-2.0 (best edge detection)
    - Enhancement: sczhou/codeformer (best face restoration)
    - Upscale: nightmareai/real-esrgan (best 4K upscale)
    - 3D Face: cjwbw/deca (best 3D reconstruction)
    """
    
    # Best-in-class models
    MODELS = {
        "background_removal": {
            "premium": "lucataco/rmbg-2.0",
            "balanced": "cjwbw/rembg",
            "fast": "cjwbw/rembg",
        },
        "face_enhancement": {
            "premium": "sczhou/codeformer",
            "balanced": "tencentarc/gfpgan",
            "fast": "tencentarc/gfpgan",
        },
        "upscale": {
            "premium": "nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94126809164e54085352f8571e106f64c2",
            "balanced": "nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94126809164e54085352f8571e106f64c2",
            "fast": "nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94126809164e54085352f8571e106f64c2",
        },
        "face_3d": {
            "premium": "cjwbw/deca",
            "balanced": "cjwbw/deca",
            "fast": "cjwbw/deca",
        }
    }
    
    # Cost estimates per operation (USD)
    COSTS = {
        "background_removal": 0.005,
        "face_enhancement": 0.02,
        "upscale": 0.01,
        "face_3d": 0.08,
    }
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize with Replicate API token."""
        self.api_token = api_token or settings.REPLICATE_API_TOKEN or os.getenv("REPLICATE_API_TOKEN")
        if self.api_token:
            os.environ["REPLICATE_API_TOKEN"] = self.api_token
    
    async def remove_background(
        self, 
        image_url: str,
        quality: ModelQuality = ModelQuality.PREMIUM
    ) -> ProcessingResult:
        """
        Remove background from image using RMBG-2.0.
        
        Best for: Portraits, product photos, any image with clear subject.
        Quality: ⭐⭐⭐⭐⭐ - Perfect hair edges, transparent output
        """
        try:
            model = self.MODELS["background_removal"][quality.value]
            
            output = replicate.run(
                model,
                input={"image": image_url}
            )
            
            # Handle different output formats
            output_url = output[0] if isinstance(output, list) else output
            
            return ProcessingResult(
                success=True,
                output_url=str(output_url),
                model_used=model,
                cost_estimate=self.COSTS["background_removal"]
            )
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=str(e)
            )
    
    async def enhance_face(
        self,
        image_url: str,
        quality: ModelQuality = ModelQuality.PREMIUM,
        upscale: int = 2,
        codeformer_fidelity: float = 0.7
    ) -> ProcessingResult:
        """
        Enhance face quality using CodeFormer.
        
        Best for: Low-quality selfies, old photos, blurry faces.
        Quality: ⭐⭐⭐⭐⭐ - Natural skin texture, sharp details
        
        Args:
            codeformer_fidelity: 0.0 = max enhancement, 1.0 = preserve original
        """
        try:
            model = self.MODELS["face_enhancement"][quality.value]
            
            if "codeformer" in model:
                output = replicate.run(
                    model,
                    input={
                        "image": image_url,
                        "upscale": upscale,
                        "face_upsample": True,
                        "codeformer_fidelity": codeformer_fidelity,
                        "background_enhance": True
                    }
                )
            else:
                # GFPGAN
                output = replicate.run(
                    model,
                    input={
                        "img": image_url,
                        "scale": upscale,
                        "version": "v1.4"
                    }
                )
            
            output_url = output[0] if isinstance(output, list) else output
            
            return ProcessingResult(
                success=True,
                output_url=str(output_url),
                model_used=model,
                cost_estimate=self.COSTS["face_enhancement"]
            )
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=str(e)
            )
    
    async def upscale_image(
        self,
        image_url: str,
        scale: int = 4,
        quality: ModelQuality = ModelQuality.PREMIUM,
        face_enhance: bool = True
    ) -> ProcessingResult:
        """
        Upscale image to 4K using Real-ESRGAN.
        
        Best for: Low-resolution images, preparing for 3D reconstruction.
        Quality: ⭐⭐⭐⭐⭐ - Sharp 4x upscale, preserves details
        """
        try:
            model = self.MODELS["upscale"][quality.value]
            
            output = replicate.run(
                model,
                input={
                    "image": image_url,
                    "scale": scale,
                    "face_enhance": face_enhance
                }
            )
            
            return ProcessingResult(
                success=True,
                output_url=str(output),
                model_used=model,
                cost_estimate=self.COSTS["upscale"]
            )
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=str(e)
            )
    
    async def reconstruct_3d_face(
        self,
        image_url: str,
        quality: ModelQuality = ModelQuality.PREMIUM
    ) -> ProcessingResult:
        """
        Create 3D face model from single photo using DECA.
        
        Best for: Creating 3D avatars, face analysis, AR effects.
        Quality: ⭐⭐⭐⭐⭐ - Accurate geometry, expressions, textures
        
        Returns:
            - 3D mesh (OBJ format)
            - Texture map
            - Shape parameters
            - Expression coefficients
        """
        try:
            model = self.MODELS["face_3d"][quality.value]
            
            output = replicate.run(
                model,
                input={"image": image_url}
            )
            
            # DECA returns multiple outputs
            return ProcessingResult(
                success=True,
                output_url=str(output) if isinstance(output, str) else str(output[0]),
                output_data=output,  # Contains mesh, texture, params
                model_used=model,
                cost_estimate=self.COSTS["face_3d"]
            )
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=str(e)
            )
    
    async def full_pipeline(
        self,
        image_url: str,
        quality: ModelQuality = ModelQuality.PREMIUM,
        include_3d: bool = True
    ) -> dict:
        """
        Run full premium pipeline:
        1. Remove background
        2. Enhance face
        3. Upscale to 4K
        4. Generate 3D model (optional)
        
        Total cost: ~$0.12/image (with 3D) or ~$0.04/image (without)
        """
        results = {
            "success": True,
            "total_cost": 0.0,
            "steps": {}
        }
        
        # Step 1: Background removal
        bg_result = await self.remove_background(image_url, quality)
        results["steps"]["background_removal"] = bg_result
        results["total_cost"] += bg_result.cost_estimate
        
        if not bg_result.success:
            results["success"] = False
            return results
        
        # Step 2: Face enhancement
        enhance_result = await self.enhance_face(bg_result.output_url, quality)
        results["steps"]["face_enhancement"] = enhance_result
        results["total_cost"] += enhance_result.cost_estimate
        
        if not enhance_result.success:
            results["success"] = False
            return results
        
        # Step 3: Upscale
        upscale_result = await self.upscale_image(enhance_result.output_url, quality=quality)
        results["steps"]["upscale"] = upscale_result
        results["total_cost"] += upscale_result.cost_estimate
        
        # Step 4: 3D reconstruction (optional)
        if include_3d:
            face_3d_result = await self.reconstruct_3d_face(upscale_result.output_url, quality)
            results["steps"]["face_3d"] = face_3d_result
            results["total_cost"] += face_3d_result.cost_estimate
        
        # Final outputs
        results["final_image"] = upscale_result.output_url
        if include_3d and results["steps"].get("face_3d"):
            results["face_3d"] = results["steps"]["face_3d"].output_data
        
        return results


# Singleton instance
_service: Optional[ReplicateAIService] = None


def get_replicate_service() -> ReplicateAIService:
    """Get or create Replicate AI service instance."""
    global _service
    if _service is None:
        _service = ReplicateAIService()
    return _service
