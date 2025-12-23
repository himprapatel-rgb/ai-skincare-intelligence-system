"""ML Model Loader Service - External Model Management

Handles loading pre-trained ML models from:
- Railway persistent volumes (primary)
- External HTTPS URLs with caching (secondary)

Implements singleton pattern to avoid repeated loads.
Thread-safe lazy initialization.
"""
import os
import hashlib
import requests
from pathlib import Path
from typing import Optional
import threading
import logging

logger = logging.getLogger(__name__)


class MLModelLoader:
    """Singleton model loader with thread-safe lazy initialization"""
    
    _instance: Optional['MLModelLoader'] = None
    _model: Optional[object] = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_model(self):
        """Load model from configured source (volume or download)
        
        Returns:
            Loaded ML model object
            
        Raises:
            FileNotFoundError: Model file not found
            RuntimeError: Model loading failed
            ValueError: Invalid configuration
        """
        if self._model is not None:
            logger.debug("Returning cached model")
            return self._model
        
        with self._lock:
            if self._model is not None:
                return self._model
            
            from app.config import settings
            
            if settings.MODEL_SOURCE == "volume":
                model_path = self._load_from_volume(settings.MODEL_PATH)
            elif settings.MODEL_SOURCE == "download":
                model_path = self._download_and_cache_model(
                    settings.MODEL_URL,
                    settings.MODEL_SHA256,
                    settings.MODEL_VERSION
                )
            else:
                raise ValueError(
                    f"Invalid MODEL_SOURCE: {settings.MODEL_SOURCE}. "
                    f"Must be 'volume' or 'download'"
                )
            
            try:
                # PLACEHOLDER: Replace with actual model loading
                # Example: import torch; self._model = torch.load(model_path)
                self._model = self._create_stub_model(model_path)
                
                logger.info(
                    f"Model loaded from {settings.MODEL_SOURCE}. "
                    f"Version: {settings.MODEL_VERSION}"
                )
                return self._model
                
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise RuntimeError(f"Model loading failed: {e}")
    
    def _load_from_volume(self, model_path: str) -> str:
        """Load model from Railway volume mount"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                f"Ensure Railway volume is properly mounted."
            )
        
        logger.info(f"Loading model from volume: {model_path}")
        return model_path
    
    def _download_and_cache_model(
        self, 
        model_url: str, 
        expected_sha256: Optional[str],
        version: str
    ) -> str:
        """Download model from URL with SHA256 verification"""
        
        if not model_url:
            raise ValueError("MODEL_URL required when MODEL_SOURCE='download'")
        
        cache_dir = Path("/tmp/model_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        model_filename = f"model_{version}.pth"
        cached_path = cache_dir / model_filename
        
        if cached_path.exists():
            if self._verify_checksum(cached_path, expected_sha256):
                logger.info(f"Using cached model: {cached_path}")
                return str(cached_path)
            else:
                logger.warning("Cached model checksum mismatch")
                cached_path.unlink()
        
        logger.info(f"Downloading model from {model_url}")
        try:
            response = requests.get(model_url, stream=True, timeout=300)
            response.raise_for_status()
            
            with open(cached_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
        except requests.RequestException as e:
            if cached_path.exists():
                cached_path.unlink()
            raise RuntimeError(f"Model download failed: {e}")
        
        if expected_sha256:
            if not self._verify_checksum(cached_path, expected_sha256):
                cached_path.unlink()
                raise ValueError("Model checksum verification failed!")
        
        logger.info("Model downloaded and verified")
        return str(cached_path)
    
    def _verify_checksum(self, file_path: Path, expected: Optional[str]) -> bool:
        """Verify SHA256 checksum"""
        if not expected:
            logger.warning("No checksum provided (NOT RECOMMENDED)")
            return True
        
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        
        actual = sha256.hexdigest()
        return actual.lower() == expected.lower()
    
    def _create_stub_model(self, model_path: str):
        """Stub model for testing - REPLACE with real implementation"""
        logger.warning("Using STUB model - replace with real model loading")
        
        class StubModel:
            def __init__(self, path):
                self.path = path
                self.version = "stub-1.0"
            
            def predict(self, image_tensor):
                return {
                    "acne": 0.15,
                    "redness": 0.25,
                    "pigmentation": 0.10,
                    "wrinkles": 0.30,
                    "uneven_tone": 0.20,
                    "rash": 0.05
                }
        
        return StubModel(model_path)


model_loader = MLModelLoader()
