"""
ML Inference Service for PyTorch Models
Handles loading and inference for acne detection and skin condition models
"""

import logging
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from typing import Dict, Optional, Tuple
import cv2
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Define model architectures to match training
class AcneBinaryModel(nn.Module):
    """Binary acne detection model architecture"""
    def __init__(self, num_classes=2):
        super(AcneBinaryModel, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 28 * 28, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

class OtherConditionModel(nn.Module):
    """Multi-class skin condition model architecture"""
    def __init__(self, num_classes=5):
        super(OtherConditionModel, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 14 * 14, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

class MLInferenceService:
    """Production ML inference service for skin analysis"""
    
    def __init__(self):
        """Initialize models and load weights"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Model paths
        self.models_dir = Path(__file__).parent.parent / "models"
        self.acne_model_path = self.models_dir / "acne_binary_v1.pt"
        self.condition_model_path = self.models_dir / "other_condition_v1.pt"
        
        # Load models
        self.acne_model = None
        self.condition_model = None
        self._load_models()
        
        # Image preprocessing parameters
        self.img_size = (224, 224)
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]
        
        # Class labels
        self.acne_labels = {0: "no_acne", 1: "acne"}
        self.condition_labels = {
            0: "normal",
            1: "acne",
            2: "rosacea",
            3: "eczema",
            4: "pigmentation"
        }
        
        logger.info("ML Inference Service initialized successfully")
    
    def _load_models(self):
        """Load PyTorch models from disk"""
        try:
            # Load acne binary model
            if self.acne_model_path.exists():
                self.acne_model = AcneBinaryModel(num_classes=2)
                self.acne_model.load_state_dict(torch.load(
                    self.acne_model_path,
                    map_location=self.device
                ))
                self.acne_model.to(self.device)
                self.acne_model.eval()
                logger.info(f"Loaded acne model from {self.acne_model_path}")
            else:
                logger.warning(f"Acne model not found at {self.acne_model_path}")
            
            # Load condition model
            if self.condition_model_path.exists():
                self.condition_model = OtherConditionModel(num_classes=5)
                self.condition_model.load_state_dict(torch.load(
                    self.condition_model_path,
                    map_location=self.device
                ))
                self.condition_model.to(self.device)
                self.condition_model.eval()
                logger.info(f"Loaded condition model from {self.condition_model_path}")
            else:
                logger.warning(f"Condition model not found at {self.condition_model_path}")
        
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
    
    def preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for model inference"""
        # Resize
        image_resized = cv2.resize(image, self.img_size)
        
        # Convert to RGB if needed
        if len(image_resized.shape) == 2:
            image_resized = cv2.cvtColor(image_resized, cv2.COLOR_GRAY2RGB)
        elif image_resized.shape[2] == 4:
            image_resized = cv2.cvtColor(image_resized, cv2.COLOR_RGBA2RGB)
        
        # Normalize to [0, 1]
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Apply ImageNet normalization
        for i in range(3):
            image_normalized[:, :, i] = (image_normalized[:, :, i] - self.mean[i]) / self.std[i]
        
        # Convert to tensor (H, W, C) -> (C, H, W)
        image_tensor = torch.from_numpy(image_normalized).permute(2, 0, 1)
        
        # Add batch dimension
        image_tensor = image_tensor.unsqueeze(0)
        
        return image_tensor.to(self.device)
    
    async def predict_acne(self, face_region: np.ndarray) -> Dict[str, any]:
        """Predict acne presence and confidence"""
        if self.acne_model is None:
            logger.warning("Acne model not loaded, using fallback")
            return {"detected": False, "confidence": 0.0, "label": "no_acne"}
        
        try:
            # Preprocess
            input_tensor = self.preprocess_image(face_region)
            
            # Inference
            with torch.no_grad():
                outputs = self.acne_model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            predicted_class = predicted.item()
            confidence_score = confidence.item()
            label = self.acne_labels.get(predicted_class, "unknown")
            
            return {
                "detected": predicted_class == 1,
                "confidence": float(confidence_score),
                "label": label,
                "probabilities": {
                    "no_acne": float(probabilities[0][0]),
                    "acne": float(probabilities[0][1])
                }
            }
        
        except Exception as e:
            logger.error(f"Error in acne prediction: {str(e)}")
            return {"detected": False, "confidence": 0.0, "label": "error"}
    
    async def predict_condition(self, face_region: np.ndarray) -> Dict[str, any]:
        """Predict skin condition type"""
        if self.condition_model is None:
            logger.warning("Condition model not loaded, using fallback")
            return {"condition": "unknown", "confidence": 0.0}
        
        try:
            # Preprocess
            input_tensor = self.preprocess_image(face_region)
            
            # Inference
            with torch.no_grad():
                outputs = self.condition_model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            predicted_class = predicted.item()
            confidence_score = confidence.item()
            condition = self.condition_labels.get(predicted_class, "unknown")
            
            # Build probabilities dict
            probs_dict = {
                label: float(probabilities[0][i])
                for i, label in self.condition_labels.items()
            }
            
            return {
                "condition": condition,
                "confidence": float(confidence_score),
                "probabilities": probs_dict
            }
        
        except Exception as e:
            logger.error(f"Error in condition prediction: {str(e)}")
            return {"condition": "error", "confidence": 0.0}
    
    async def analyze_skin_with_ml(self, face_region: np.ndarray) -> Dict[str, any]:
        """Complete ML-based skin analysis"""
        try:
            # Run both models
            acne_result = await self.predict_acne(face_region)
            condition_result = await self.predict_condition(face_region)
            
            return {
                "acne_analysis": acne_result,
                "condition_analysis": condition_result,
                "ml_models_used": {
                    "acne_model": self.acne_model is not None,
                    "condition_model": self.condition_model is not None
                }
            }
        
        except Exception as e:
            logger.error(f"Error in ML skin analysis: {str(e)}")
            raise

# Singleton instance
_ml_inference_service: Optional[MLInferenceService] = None

def get_ml_inference_service() -> MLInferenceService:
    """Get or create singleton instance of MLInferenceService"""
    global _ml_inference_service
    if _ml_inference_service is None:
        _ml_inference_service = MLInferenceService()
    return _ml_inference_service
