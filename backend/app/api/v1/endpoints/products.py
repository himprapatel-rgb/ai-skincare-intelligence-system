"""Product ML Endpoints for Suitability Predictions

Provides ML-powered product suitability scoring and recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.ml_service import get_ml_service
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models for request/response
class UserProfile(BaseModel):
    """User skin profile for ML inference."""
    skin_type: str = Field(..., description="User's skin type")
    concerns: List[str] = Field(default_factory=list, description="Skin concerns")
    sensitivities: List[str] = Field(default_factory=list, description="Known sensitivities")


class ProductData(BaseModel):
    """Product information for ML inference."""
    product_id: Optional[str] = Field(None, description="Product identifier")
    name: str = Field(..., description="Product name")
    ingredients: List[str] = Field(default_factory=list, description="Ingredient list")
    category: Optional[str] = Field(None, description="Product category")


class SuitabilityRequest(BaseModel):
    """Request for product suitability prediction."""
    user_profile: UserProfile
    product_data: ProductData


class SuitabilityResponse(BaseModel):
    """Response with suitability prediction."""
    suitability_score: float = Field(..., description="Score 0-1 indicating product match")
    confidence: float = Field(..., description="Prediction confidence 0-1")
    explanation: str = Field(..., description="Human-readable explanation")
    warnings: List[str] = Field(default_factory=list, description="Potential concerns")
    model_version: str = Field(..., description="Model version used")
    timestamp: str = Field(..., description="Prediction timestamp")


class ModelInfoResponse(BaseModel):
    """ML model information."""
    version: str
    loaded: bool
    type: str
    ready_for_ml: bool
    description: str


@router.post(
    "/analyze",
    response_model=SuitabilityResponse,
    summary="Analyze Product Suitability",
    description="Get ML-powered suitability prediction for a product based on user profile"
)
async def analyze_product_suitability(
    request: SuitabilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> SuitabilityResponse:
    """Analyze product suitability for user.
    
    Args:
        request: Product and user profile data
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Suitability prediction with score, confidence, and warnings
    """
    try:
        logger.info(f"Product suitability analysis requested by user {current_user.id}")
        
        # Get ML service
        ml_service = get_ml_service()
        
        # Convert Pydantic models to dicts
        user_profile_dict = request.user_profile.dict()
        product_data_dict = request.product_data.dict()
        
        # Generate prediction
        prediction = await ml_service.predict(
            user_profile=user_profile_dict,
            product_data=product_data_dict
        )
        
        logger.info(f"Prediction generated: score={prediction['suitability_score']}")
        
        return SuitabilityResponse(**prediction)
        
    except Exception as e:
        logger.error(f"Error analyzing product suitability: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze product suitability: {str(e)}"
        )


@router.get(
    "/model-info",    response_model=ModelInfoResponse,
    summary="Get ML Model Information",
    description="Retrieve information about the active ML model"
)
async def get_model_info(
    current_user: User = Depends(get_current_user)
) -> ModelInfoResponse:
    """Get ML model information.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Model metadata and status
    """
    try:
        ml_service = get_ml_service()
        model_info = ml_service.get_model_info()
        
        return ModelInfoResponse(**model_info)
        
    except Exception as e:
        logger.error(f"Error retrieving model info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model information: {str(e)}"
        )


@router.post(
    "/batch-analyze",    response_model=List[SuitabilityResponse],
    summary="Batch Analyze Products",
    description="Analyze multiple products at once for efficiency"
)
async def batch_analyze_products(
    requests: List[SuitabilityRequest],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[SuitabilityResponse]:
    """Batch analyze multiple products.
    
    Args:
        requests: List of product analysis requests
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of suitability predictions
    """
    try:
        logger.info(f"Batch analysis requested by user {current_user.id} for {len(requests)} products")
        
        ml_service = get_ml_service()
        results = []
        
        for req in requests:
            user_profile_dict = req.user_profile.dict()
            product_data_dict = req.product_data.dict()
            
            prediction = await ml_service.predict(
                user_profile=user_profile_dict,
                product_data=product_data_dict
            )
            
            results.append(SuitabilityResponse(**prediction))
        
        logger.info(f"Batch analysis complete: {len(results)} predictions generated")
        
        return results
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform batch analysis: {str(e)}"
        )
