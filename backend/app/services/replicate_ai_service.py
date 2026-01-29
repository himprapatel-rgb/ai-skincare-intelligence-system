"""
AI Processing Service - Supports Multiple Providers

Providers:
1. REPLICATE (Cloud) - Pay per use, ~$0.12/image
2. SELF_HOSTED (Future) - Your Dell server at home, $0 per image

This service provides access to the best AI models for:
1. Background Removal (RMBG-2.0)
2. Face Enhancement (CodeFormer + GFPGAN)
3. Image Upscaling (Real-ESRGAN)
4. 3D Face Reconstruction (DECA)

Switch providers by setting AI_PROVIDER in environment:
- AI_PROVIDER=replicate (default, cloud)
- AI_PROVIDER=self_hosted (your Dell server)
"""

import os
import base64
import httpx
import logging
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from app.config import settings

logger = logging.getLogger(__name__)

# Only import replicate if using cloud provider
try:
    import replicate
    REPLICATE_AVAILABLE = True
except ImportError:
    REPLICATE_AVAILABLE = False
    logger.warning("Replicate package not installed. Cloud AI will not work.")


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


class AIProvider(Enum):
    """AI processing provider options"""
    REPLICATE = "replicate"      # Cloud - Replicate.com
    SELF_HOSTED = "self_hosted"  # Your Dell server at home


class ReplicateAIService:
    """
    AI processing service supporting multiple providers.
    
    Providers:
    1. REPLICATE (Cloud) - Uses Replicate.com API
       - Cost: ~$0.12/image
       - No setup required
       
    2. SELF_HOSTED (Future) - Your Dell server at home
       - Cost: $0/image (only electricity)
       - Requires server setup with GPU
    
    Models used:
    - Background: RMBG-2.0 (best edge detection)
    - Enhancement: CodeFormer (best face restoration)
    - Upscale: Real-ESRGAN (best 4K upscale)
    - 3D Face: DECA (best 3D reconstruction)
    
    Switch providers:
        AI_PROVIDER=replicate (default)
        AI_PROVIDER=self_hosted
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
    
    def __init__(self, api_token: Optional[str] = None, provider: Optional[str] = None):
        """
        Initialize AI service.
        
        Args:
            api_token: API token (Replicate or self-hosted)
            provider: Override provider ("replicate" or "self_hosted")
        """
        # Determine provider
        provider_str = provider or settings.AI_PROVIDER or "replicate"
        self.provider = AIProvider(provider_str.lower())
        
        if self.provider == AIProvider.REPLICATE:
            # Cloud provider - Replicate
            self.api_token = api_token or settings.REPLICATE_API_TOKEN or os.getenv("REPLICATE_API_TOKEN")
            if self.api_token:
                os.environ["REPLICATE_API_TOKEN"] = self.api_token
            self.base_url = "https://api.replicate.com"
            logger.info("AI Provider: Replicate (Cloud) - Cost per image: ~$0.12")
        else:
            # Self-hosted provider - Your Dell server
            self.api_token = api_token or settings.SELF_HOSTED_ML_TOKEN
            self.base_url = settings.SELF_HOSTED_ML_URL or "http://localhost:5000"
            logger.info(f"AI Provider: Self-Hosted at {self.base_url} - Cost per image: $0")
        
        # HTTP client for self-hosted calls
        self._http_client = None
    
    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for self-hosted API calls."""
        if self._http_client is None:
            headers = {}
            if self.api_token:
                headers["Authorization"] = f"Bearer {self.api_token}"
            self._http_client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=120.0
            )
        return self._http_client
    
    def _get_cost(self, operation: str) -> float:
        """Get cost for operation (0 for self-hosted)."""
        if self.provider == AIProvider.SELF_HOSTED:
            return 0.0
        return self.COSTS.get(operation, 0.0)
    
    async def _self_hosted_call(
        self,
        endpoint: str,
        image_url: str,
        operation: str,
        **extra_params
    ) -> ProcessingResult:
        """
        Call self-hosted ML server (your Dell server).
        
        Expected API format on your server:
        POST /remove-background  {"image_url": "..."}
        POST /enhance-face       {"image_url": "...", "upscale": 2}
        POST /upscale            {"image_url": "...", "scale": 4}
        POST /reconstruct-3d     {"image_url": "..."}
        
        Response: {"success": true, "output_url": "..."}
        """
        try:
            payload = {"image_url": image_url, **extra_params}
            
            response = await self.http_client.post(endpoint, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            return ProcessingResult(
                success=result.get("success", True),
                output_url=result.get("output_url"),
                output_data=result.get("output_data"),
                model_used=f"self_hosted:{endpoint}",
                cost_estimate=0.0,  # Free - your own server!
                error=result.get("error")
            )
        except Exception as e:
            logger.error(f"Self-hosted ML call failed: {e}")
            return ProcessingResult(
                success=False,
                error=f"Self-hosted server error: {str(e)}"
            )
    
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
            if self.provider == AIProvider.SELF_HOSTED:
                # Call your Dell server
                return await self._self_hosted_call(
                    endpoint="/remove-background",
                    image_url=image_url,
                    operation="background_removal"
                )
            
            # Cloud - Replicate
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
                cost_estimate=self._get_cost("background_removal")
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
            if self.provider == AIProvider.SELF_HOSTED:
                return await self._self_hosted_call(
                    endpoint="/enhance-face",
                    image_url=image_url,
                    operation="face_enhancement",
                    upscale=upscale,
                    fidelity=codeformer_fidelity
                )
            
            # Cloud - Replicate
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
                cost_estimate=self._get_cost("face_enhancement")
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
            if self.provider == AIProvider.SELF_HOSTED:
                return await self._self_hosted_call(
                    endpoint="/upscale",
                    image_url=image_url,
                    operation="upscale",
                    scale=scale,
                    face_enhance=face_enhance
                )
            
            # Cloud - Replicate
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
                cost_estimate=self._get_cost("upscale")
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
            if self.provider == AIProvider.SELF_HOSTED:
                return await self._self_hosted_call(
                    endpoint="/reconstruct-3d",
                    image_url=image_url,
                    operation="face_3d"
                )
            
            # Cloud - Replicate
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
                cost_estimate=self._get_cost("face_3d")
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
