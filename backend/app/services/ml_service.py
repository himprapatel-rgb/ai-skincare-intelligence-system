"""ML Inference Service for Product Suitability Prediction

Provides ML-powered product recommendations and suitability scoring
based on user skin profiles and product ingredients.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class MLInferenceService:
    """Service for ML-based product suitability inference.
    
    Current implementation uses rule-based logic as a foundation.
    Future iterations will integrate trained ML models from R2 storage.
    """

    def __init__(self):
        """Initialize the ML inference service."""
        self.model_version = "stub-v1.0"
        self.model_loaded = False
        logger.info(f"MLInferenceService initialized with model version: {self.model_version}")

    async def load_active_model(self, model_path: Optional[str] = None) -> bool:
        """Load the active ML model.
        
        Args:
            model_path: Optional path to model file (future: from R2)
            
        Returns:
            bool: True if model loaded successfully
        """
        try:
            # Stub: In production, this will load model from R2
            # For now, we use rule-based logic
            self.model_loaded = True
            logger.info(f"Model {self.model_version} loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return False

    def extract_features(self, 
                        user_profile: Dict[str, Any], 
                        product_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract features for ML inference.
        
        Args:
            user_profile: User skin profile data
            product_data: Product ingredient and metadata
            
        Returns:
            Dict containing extracted features
        """
        features = {}
        
        # Extract user features
        skin_type = user_profile.get('skin_type', 'unknown')
        concerns = user_profile.get('concerns', [])
        sensitivities = user_profile.get('sensitivities', [])
        
        # Extract product features
        ingredients = product_data.get('ingredients', [])
        category = product_data.get('category', 'unknown')
        
        # Feature engineering (stub - simplified for now)
        features['has_sensitive_ingredients'] = any(
            ing.lower() in ['fragrance', 'alcohol', 'sulfate'] 
            for ing in ingredients
        )
        features['skin_type_match'] = 1.0 if skin_type != 'unknown' else 0.5
        features['ingredient_count'] = len(ingredients)
        features['concern_alignment'] = len(concerns) / max(len(concerns), 1)
        
        return features

    async def predict(self, 
                     user_profile: Dict[str, Any], 
                     product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate product suitability prediction.
        
        Args:
            user_profile: User skin profile with type, concerns, sensitivities
            product_data: Product information including ingredients
            
        Returns:
            Dict containing:
                - suitability_score: Float 0-1 indicating product match
                - confidence: Float 0-1 indicating prediction confidence
                - explanation: Human-readable explanation
                - warnings: List of potential concerns
                - timestamp: Prediction timestamp
        """
        if not self.model_loaded:
            await self.load_active_model()
        
        try:
            # Extract features
            features = self.extract_features(user_profile, product_data)
            
            # Rule-based scoring (stub for ML model)
            base_score = 0.7
            
            # Adjust score based on features
            if features['has_sensitive_ingredients']:
                if 'sensitive' in user_profile.get('skin_type', '').lower():
                    base_score -= 0.3
                else:
                    base_score -= 0.1
            
            # Boost for skin type match
            base_score += features['skin_type_match'] * 0.1
            
            # Ensure score is in valid range
            suitability_score = max(0.0, min(1.0, base_score))
            
            # Generate warnings
            warnings = []
            sensitivities = user_profile.get('sensitivities', [])
            ingredients = product_data.get('ingredients', [])
            
            for sensitivity in sensitivities:
                if any(sensitivity.lower() in ing.lower() for ing in ingredients):
                    warnings.append(f"Contains {sensitivity} - listed in your sensitivities")
            
            if features['has_sensitive_ingredients']:
                warnings.append("Contains potentially irritating ingredients")
            
            # Generate explanation
            if suitability_score >= 0.7:
                explanation = "Good match for your skin profile"
            elif suitability_score >= 0.5:
                explanation = "Moderate compatibility - consider patch testing"
            else:
                explanation = "Low compatibility - may not be suitable"
            
            # Calculate confidence
            confidence = 0.75  # Stub - will be model's confidence in future
            
            result = {
                'suitability_score': round(suitability_score, 2),
                'confidence': confidence,
                'explanation': explanation,
                'warnings': warnings,
                'model_version': self.model_version,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Prediction generated: score={suitability_score:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return {
                'suitability_score': 0.5,
                'confidence': 0.0,
                'explanation': 'Error generating prediction',
                'warnings': ['Prediction service error'],
                'model_version': self.model_version,
                'timestamp': datetime.utcnow().isoformat()
            }

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model.
        
        Returns:
            Dict containing model metadata
        """
        return {
            'version': self.model_version,
            'loaded': self.model_loaded,
            'type': 'rule-based-stub',
            'ready_for_ml': True,
            'description': 'Foundation service ready for ML model integration'
        }


# Global service instance
_ml_service: Optional[MLInferenceService] = None


def get_ml_service() -> MLInferenceService:
    """Get or create the ML service singleton.
    
    Returns:
        MLInferenceService instance
    """
    global _ml_service
    if _ml_service is None:
        _ml_service = MLInferenceService()
    return _ml_service
