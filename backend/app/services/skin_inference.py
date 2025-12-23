"""Skin Inference Service - ML Model Wrapper

Provides stable inference interface independent of model implementation.
Returns consistent JSON schema for API responses.
"""
from typing import Dict, List
from pathlib import Path
import logging
from datetime import datetime
from PIL import Image
import numpy as np

from app.services.ml_model_loader import model_loader
from app.config import settings

logger = logging.getLogger(__name__)


class SkinInferenceService:
    """Wrapper for skin analysis ML inference"""
    
    # Standardized condition names
    CONDITION_NAMES = {
        "acne": "Acne/Pimples",
        "redness": "Redness/Inflammation",
        "pigmentation": "Pigmentation/Dark Spots",
        "wrinkles": "Fine Lines & Wrinkles",
        "uneven_tone": "Uneven Skin Tone",
        "rash": "Rash/Irritation"
    }
    
    def __init__(self):
        self.model = None
        self.model_version = settings.MODEL_VERSION
    
    def _ensure_model_loaded(self):
        """Lazy load model on first inference"""
        if self.model is None:
            logger.info("Loading ML model for first inference...")
            try:
                self.model = model_loader.load_model()
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise RuntimeError(f"Model loading failed: {e}")
    
    def analyze_image(self, image_path: str) -> Dict:
        """Run skin analysis inference on an image
        
        Args:
            image_path: Path to saved face scan image
            
        Returns:
            Standardized analysis result:
            {
                "conditions": [{"name": str, "score": float, "severity": str}],
                "overall_score": float,
                "notes": str,
                "model_version": str,
                "inference_time_ms": int
            }
            
        Raises:
            FileNotFoundError: Image file not found
            RuntimeError: Inference failed
        """
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        start_time = datetime.utcnow()
        
        try:
            # Ensure model is loaded
            self._ensure_model_loaded()
            
            # Preprocess image
            image_tensor = self._preprocess_image(image_path)
            
            # Run inference
            raw_predictions = self.model.predict(image_tensor)
            
            # Post-process to standardized format
            result = self._postprocess_predictions(raw_predictions)
            
            # Add metadata
            inference_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            result["model_version"] = self.model_version
            result["inference_time_ms"] = int(inference_time)
            
            logger.info(
                f"Inference completed in {inference_time:.0f}ms. "
                f"Overall score: {result['overall_score']:.2f}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Inference failed for {image_path}: {e}")
            raise RuntimeError(f"Skin analysis inference failed: {e}")
    
    def _preprocess_image(self, image_path: str):
        """Preprocess image for model input
        
        PLACEHOLDER: Replace with model-specific preprocessing
        Common steps:
        - Resize to model input size (e.g., 224x224)
        - Normalize pixel values
        - Convert to tensor format
        """
        try:
            image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to standard size
            image = image.resize((224, 224))
            
            # Convert to numpy array (placeholder)
            # In real implementation, convert to your framework's tensor
            image_array = np.array(image)
            
            return image_array
            
        except Exception as e:
            raise RuntimeError(f"Image preprocessing failed: {e}")
    
    def _postprocess_predictions(self, raw_predictions: Dict) -> Dict:
        """Convert raw model outputs to standardized format"""
        
        conditions = []
        for key, score in raw_predictions.items():
            if key in self.CONDITION_NAMES:
                conditions.append({
                    "name": self.CONDITION_NAMES[key],
                    "score": float(score),
                    "severity": self._score_to_severity(score)
                })
        
        # Sort by score descending
        conditions.sort(key=lambda x: x["score"], reverse=True)
        
        # Calculate overall score (weighted average)
        overall_score = (
            sum(c["score"] for c in conditions) / len(conditions) 
            if conditions else 0.0
        )
        
        # Generate notes
        notes = self._generate_notes(conditions, overall_score)
        
        return {
            "conditions": conditions,
            "overall_score": round(overall_score, 3),
            "notes": notes
        }
    
    def _score_to_severity(self, score: float) -> str:
        """Map numeric score to severity label"""
        if score < 0.2:
            return "minimal"
        elif score < 0.4:
            return "mild"
        elif score < 0.6:
            return "moderate"
        else:
            return "significant"
    
    def _generate_notes(self, conditions: List[Dict], overall_score: float) -> str:
        """Generate human-readable notes from analysis"""
        if overall_score < 0.2:
            mood = "Your skin looks balanced and healthy."
        elif overall_score < 0.4:
            mood = "Minor concerns detected. Maintain your routine."
        elif overall_score < 0.6:
            mood = "Some areas need attention. Consider targeted treatments."
        else:
            mood = "Multiple concerns detected. Professional consultation recommended."
        
        top_concerns = [
            c["name"] for c in conditions[:2] 
            if c["score"] > 0.3
        ]
        
        if top_concerns:
            concern_text = f" Primary focus: {', '.join(top_concerns)}."
        else:
            concern_text = ""
        
        return f"{mood}{concern_text}"


# Global singleton instance
skin_inference_service = SkinInferenceService()
