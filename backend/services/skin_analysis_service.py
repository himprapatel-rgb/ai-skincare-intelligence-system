"""
Production-ready Skin Analysis Service
Implements MediaPipe face detection and comprehensive skin analysis
"""

import logging
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image
import io
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SkinAnalysisResult:
    """Results from skin analysis"""
    skin_tone: str
    texture_quality: float
    acne_detected: bool
    acne_severity: str
    wrinkles_detected: bool
    wrinkle_density: float
    dark_circles_detected: bool
    dark_circle_severity: float
    skin_type: str
    confidence_score: float
    face_landmarks: Optional[List[Dict[str, float]]] = None
    
class SkinAnalysisService:
    """Production-ready skin analysis using MediaPipe and OpenCV"""
    
    def __init__(self):
        """Initialize MediaPipe face detection and mesh"""
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        
        # Initialize detectors with production settings
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # Full range model for better accuracy
            min_detection_confidence=0.7
        )
        
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        logger.info("Skin Analysis Service initialized successfully")
    
    async def analyze_skin(self, image_data: bytes) -> SkinAnalysisResult:
        """
        Analyze skin from image data
        
        Args:
            image_data: Image bytes data
            
        Returns:
            SkinAnalysisResult with comprehensive analysis
        """
        try:
            # Convert bytes to image
            image = self._bytes_to_image(image_data)
            
            # Detect face
            face_region, face_landmarks = self._detect_face(image)
            
            if face_region is None:
                raise ValueError("No face detected in image")
            
            # Analyze skin characteristics
            skin_tone = self._analyze_skin_tone(face_region)
            texture_quality = self._analyze_texture(face_region)
            acne_detected, acne_severity = self._detect_acne(face_region)
            wrinkles_detected, wrinkle_density = self._detect_wrinkles(face_region)
            dark_circles_detected, dark_circle_severity = self._detect_dark_circles(
                face_region, face_landmarks
            )
            skin_type = self._determine_skin_type(face_region, texture_quality)
            confidence_score = self._calculate_confidence(face_region)
            
            result = SkinAnalysisResult(
                skin_tone=skin_tone,
                texture_quality=texture_quality,
                acne_detected=acne_detected,
                acne_severity=acne_severity,
                wrinkles_detected=wrinkles_detected,
                wrinkle_density=wrinkle_density,
                dark_circles_detected=dark_circles_detected,
                dark_circle_severity=dark_circle_severity,
                skin_type=skin_type,
                confidence_score=confidence_score,
                face_landmarks=face_landmarks
            )
            
            logger.info(f"Skin analysis completed with confidence: {confidence_score:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Error in skin analysis: {str(e)}")
            raise
    
    def _bytes_to_image(self, image_data: bytes) -> np.ndarray:
        """Convert bytes to OpenCV image"""
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    def _detect_face(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[List[Dict]]]:
        """Detect face and extract region with landmarks"""
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return None, None
        
        # Get face landmarks
        face_landmarks = results.multi_face_landmarks[0]
        h, w = image.shape[:2]
        
        # Extract landmarks as list of dicts
        landmarks_list = [
            {"x": landmark.x, "y": landmark.y, "z": landmark.z}
            for landmark in face_landmarks.landmark
        ]
        
        # Get bounding box from landmarks
        x_coords = [int(lm.x * w) for lm in face_landmarks.landmark]
        y_coords = [int(lm.y * h) for lm in face_landmarks.landmark]
        
        x_min, x_max = max(0, min(x_coords) - 20), min(w, max(x_coords) + 20)
        y_min, y_max = max(0, min(y_coords) - 20), min(h, max(y_coords) + 20)
        
        face_region = image[y_min:y_max, x_min:x_max]
        
        return face_region, landmarks_list
    
    def _analyze_skin_tone(self, face_region: np.ndarray) -> str:
        """Analyze skin tone using color analysis"""
        # Convert to LAB color space for better skin tone analysis
        lab = cv2.cvtColor(face_region, cv2.COLOR_RGB2LAB)
        l_channel = lab[:, :, 0]
        
        mean_lightness = np.mean(l_channel)
        
        if mean_lightness > 200:
            return "very_light"
        elif mean_lightness > 170:
            return "light"
        elif mean_lightness > 140:
            return "medium"
        elif mean_lightness > 110:
            return "medium_dark"
        else:
            return "dark"
    
    def _analyze_texture(self, face_region: np.ndarray) -> float:
        """Analyze skin texture quality (0-1, higher is better)"""
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        
        # Use Laplacian variance for texture analysis
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Normalize to 0-1 range (higher variance = more texture details)
        # Inverse for quality score (smoother = better)
        texture_quality = 1.0 - min(laplacian_var / 1000.0, 1.0)
        
        return float(texture_quality)
    
    def _detect_acne(self, face_region: np.ndarray) -> Tuple[bool, str]:
        """Detect acne and determine severity"""
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
        
        # Red/pink color range for acne detection
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([160, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        
        # Count red pixels (potential acne)
        red_pixels = np.sum(red_mask > 0)
        total_pixels = face_region.shape[0] * face_region.shape[1]
        acne_ratio = red_pixels / total_pixels
        
        if acne_ratio < 0.01:
            return False, "none"
        elif acne_ratio < 0.03:
            return True, "mild"
        elif acne_ratio < 0.06:
            return True, "moderate"
        else:
            return True, "severe"
    
    def _detect_wrinkles(self, face_region: np.ndarray) -> Tuple[bool, float]:
        """Detect wrinkles using edge detection"""
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Detect edges (wrinkles appear as fine lines)
        edges = cv2.Canny(blurred, 30, 100)
        
        # Calculate wrinkle density
        edge_pixels = np.sum(edges > 0)
        total_pixels = face_region.shape[0] * face_region.shape[1]
        wrinkle_density = edge_pixels / total_pixels
        
        wrinkles_detected = wrinkle_density > 0.05
        
        return wrinkles_detected, float(wrinkle_density)
    
    def _detect_dark_circles(
        self, face_region: np.ndarray, landmarks: Optional[List[Dict]]
    ) -> Tuple[bool, float]:
        """Detect dark circles under eyes"""
        if landmarks is None or len(landmarks) < 200:
            return False, 0.0
        
        # Approximate eye region (MediaPipe landmarks)
        # Under-eye region is typically darker
        h, w = face_region.shape[:2]
        
        # Convert to LAB for luminance analysis
        lab = cv2.cvtColor(face_region, cv2.COLOR_RGB2LAB)
        l_channel = lab[:, :, 0]
        
        # Under-eye region (approximate)
        eye_region_y_start = int(h * 0.4)
        eye_region_y_end = int(h * 0.6)
        under_eye_region = l_channel[eye_region_y_start:eye_region_y_end, :]
        
        under_eye_darkness = 255 - np.mean(under_eye_region)
        face_darkness = 255 - np.mean(l_channel)
        
        # Calculate relative darkness
        if face_darkness > 0:
            darkness_ratio = under_eye_darkness / face_darkness
            dark_circles_detected = darkness_ratio > 1.15
            severity = min((darkness_ratio - 1.0) * 2.0, 1.0)
        else:
            dark_circles_detected = False
            severity = 0.0
        
        return dark_circles_detected, float(severity)
    
    def _determine_skin_type(self, face_region: np.ndarray, texture_quality: float) -> str:
        """Determine skin type (oily, dry, combination, normal)"""
        # Convert to HSV
        hsv = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
        
        # Analyze saturation and value
        saturation = np.mean(hsv[:, :, 1])
        value = np.mean(hsv[:, :, 2])
        
        # Higher saturation often indicates oily skin
        # Lower value with low texture quality indicates dry skin
        if saturation > 100 and value > 150:
            return "oily"
        elif saturation < 60 and texture_quality < 0.4:
            return "dry"
        elif saturation > 80:
            return "combination"
        else:
            return "normal"
    
    def _calculate_confidence(self, face_region: np.ndarray) -> float:
        """Calculate confidence score for the analysis"""
        # Basic confidence based on image quality
        if face_region.size == 0:
            return 0.0
        
        # Check image quality metrics
        h, w = face_region.shape[:2]
        pixels = h * w
        
        # Image should be reasonably sized
        if pixels < 10000:  # Less than 100x100
            size_score = 0.5
        elif pixels < 50000:  # Less than ~224x224
            size_score = 0.7
        else:
            size_score = 1.0
        
        # Check sharpness using Laplacian
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Higher variance = sharper image
        if laplacian_var < 50:
            sharpness_score = 0.5
        elif laplacian_var < 100:
            sharpness_score = 0.7
        else:
            sharpness_score = 1.0
        
        confidence = (size_score + sharpness_score) / 2.0
        
        return float(confidence)
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'face_detection'):
            self.face_detection.close()
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()
        logger.info("Skin Analysis Service resources released")


# Singleton instance
_skin_analysis_service: Optional[SkinAnalysisService] = None

def get_skin_analysis_service() -> SkinAnalysisService:
    """Get or create singleton instance of SkinAnalysisService"""
    global _skin_analysis_service
    if _skin_analysis_service is None:
        _skin_analysis_service = SkinAnalysisService()
    return _skin_analysis_service
