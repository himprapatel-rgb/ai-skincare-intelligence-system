"""ML Model Loader Service - External Model Management

Handles loading pre-trained ML models from:
- Railway persistent volumes (primary)
- External providers: Hugging Face, OpenAI, Google Cloud (Story 16.2)
- HTTPS URLs with caching (fallback)

Implements singleton pattern to avoid repeated loads.
Thread-safe lazy initialization.

Status: Story 16.2 - External Model Integration
Created: December 6, 2025
Updated: December 6, 2025 - Added multi-provider support
"""

import os
import hashlib
import requests
from pathlib import Path
from typing import Optional, Dict, Any
import threading
import logging
import json

logger = logging.getLogger(__name__)


class MLModelLoader:
    """Singleton model loader with thread-safe lazy initialization and multi-provider support"""
    
    _instance: Optional['MLModelLoader'] = None
    _model: Optional[object] = None
    _lock = threading.Lock()
    _provider_cache: Dict[str, Any] = {}
    
    # Supported external providers
    SUPPORTED_PROVIDERS = [
        'volume',       # Railway volume (Story 16.1)
        'huggingface',  # Hugging Face Hub (Story 16.2)
        'openai',       # OpenAI API (Story 16.2)
        'google',       # Google Cloud AI (Story 16.2)
        'download'      # Direct HTTPS download (fallback)
    ]
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_model(self, provider: Optional[str] = None):
        """Load model from configured source
        
        Args:
            provider: Override default provider (volume, huggingface, openai, google, download)
        
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
            
            from app.config.storage import StorageConfig
            storage = StorageConfig()
            
            # Determine provider
            model_source = provider or os.getenv('MODEL_SOURCE', 'volume')
            
            if model_source not in self.SUPPORTED_PROVIDERS:
                raise ValueError(
                    f"Invalid MODEL_SOURCE: {model_source}. "
                    f"Supported: {', '.join(self.SUPPORTED_PROVIDERS)}"
                )
            
            try:
                # Load based on provider
                if model_source == 'volume':
                    model_path = self._load_from_volume(storage)
                elif model_source == 'huggingface':
                    model_path = self._load_from_huggingface()
                elif model_source == 'openai':
                    return self._load_from_openai()
                elif model_source == 'google':
                    return self._load_from_google()
                elif model_source == 'download':
                    model_path = self._download_and_cache_model()
                
                # Load model file (for file-based providers)
                if model_source in ['volume', 'huggingface', 'download']:
                    self._model = self._load_model_file(model_path)
                
                logger.info(
                    f"Model loaded successfully from {model_source}. "
                    f"Provider: {model_source}"
                )
                return self._model
            
            except Exception as e:
                logger.error(f"Failed to load model from {model_source}: {e}")
                raise RuntimeError(f"Model loading failed: {e}")
    
    def _load_from_volume(self, storage: 'StorageConfig') -> str:
        """Load model from Railway volume mount (Story 16.1)"""
        model_path = storage.get_model_path()
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                f"Ensure Railway volume is mounted at {storage.volume_mount_path}"
            )
        
        logger.info(f"Loading model from Railway volume: {model_path}")
        return model_path
    
    def _load_from_huggingface(self) -> str:
        """Load model from Hugging Face Hub (Story 16.2)
        
        Environment variables:
            HF_MODEL_ID: Model identifier (e.g., "facebook/skin-condition-classifier")
            HF_API_TOKEN: Optional API token for private models
            HF_CACHE_DIR: Cache directory (default: /data/models/huggingface)
        """
        try:
            from transformers import AutoModel
        except ImportError:
            raise RuntimeError(
                "transformers library not installed. "
                "Install with: pip install transformers"
            )
        
        model_id = os.getenv('HF_MODEL_ID')
        if not model_id:
            raise ValueError("HF_MODEL_ID environment variable required for Hugging Face")
        
        api_token = os.getenv('HF_API_TOKEN')
        cache_dir = os.getenv('HF_CACHE_DIR', '/data/models/huggingface')
        
        logger.info(f"Loading Hugging Face model: {model_id}")
        
        # Download and cache model
        os.makedirs(cache_dir, exist_ok=True)
        
        model = AutoModel.from_pretrained(
            model_id,
            cache_dir=cache_dir,
            use_auth_token=api_token if api_token else None
        )
        
        self._provider_cache['huggingface'] = {
            'model_id': model_id,
            'cache_dir': cache_dir
        }
        
        logger.info(f"Hugging Face model loaded: {model_id}")
        return model
    
    def _load_from_openai(self) -> Dict[str, Any]:
        """Load OpenAI API client (Story 16.2)
        
        Environment variables:
            OPENAI_API_KEY: OpenAI API key (required)
            OPENAI_MODEL: Model name (default: gpt-4-vision-preview)
        """
        try:
            import openai
        except ImportError:
            raise RuntimeError(
                "openai library not installed. "
                "Install with: pip install openai"
            )
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable required")
        
        model_name = os.getenv('OPENAI_MODEL', 'gpt-4-vision-preview')
        
        openai.api_key = api_key
        
        self._provider_cache['openai'] = {
            'model': model_name,
            'client': openai
        }
        
        logger.info(f"OpenAI API client initialized: {model_name}")
        
        # Return wrapper object
        class OpenAIWrapper:
            def __init__(self, model_name, client):
                self.model = model_name
                self.client = client
            
            def predict(self, image_data):
                """Placeholder for OpenAI vision analysis"""
                # TODO: Implement actual OpenAI API call
                logger.warning("OpenAI predict() is a stub - implement API call")
                return {'stub': True, 'provider': 'openai'}
        
        return OpenAIWrapper(model_name, openai)
    
    def _load_from_google(self) -> Dict[str, Any]:
        """Load Google Cloud Vision API client (Story 16.2)
        
        Environment variables:
            GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON
            GOOGLE_PROJECT_ID: GCP project ID
        """
        try:
            from google.cloud import vision
        except ImportError:
            raise RuntimeError(
                "google-cloud-vision library not installed. "
                "Install with: pip install google-cloud-vision"
            )
        
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        project_id = os.getenv('GOOGLE_PROJECT_ID')
        
        if not credentials_path:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS required")
        
        client = vision.ImageAnnotatorClient()
        
        self._provider_cache['google'] = {
            'project_id': project_id,
            'client': client
        }
        
        logger.info(f"Google Cloud Vision API initialized: {project_id}")
        
        # Return wrapper object
        class GoogleVisionWrapper:
            def __init__(self, client, project_id):
                self.client = client
                self.project_id = project_id
            
            def predict(self, image_data):
                """Placeholder for Google Vision API call"""
                # TODO: Implement actual Google Vision API call
                logger.warning("Google predict() is a stub - implement API call")
                return {'stub': True, 'provider': 'google'}
        
        return GoogleVisionWrapper(client, project_id)
    
    def _download_and_cache_model(self) -> str:
        """Download model from URL with SHA256 verification"""
        model_url = os.getenv('MODEL_URL')
        if not model_url:
            raise ValueError("MODEL_URL required when MODEL_SOURCE='download'")
        
        expected_sha256 = os.getenv('MODEL_SHA256')
        version = os.getenv('MODEL_VERSION', '1.0')
        
        cache_dir = Path("/data/models/cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        model_filename = f"model_{version}.pth"
        cached_path = cache_dir / model_filename
        
        if cached_path.exists():
            if self._verify_checksum(cached_path, expected_sha256):
                logger.info(f"Using cached model: {cached_path}")
                return str(cached_path)
            else:
                logger.warning("Cached model checksum mismatch, re-downloading")
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
            logger.warning("No checksum provided - skipping verification (NOT RECOMMENDED)")
            return True
        
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        
        actual = sha256.hexdigest()
        return actual.lower() == expected.lower()
    
    def _load_model_file(self, model_path: str):
        """Load model from file path
        
        TODO: Replace with actual model loading logic
        Example implementations:
        - PyTorch: torch.load(model_path)
        - TensorFlow: tf.keras.models.load_model(model_path)
        - ONNX: onnxruntime.InferenceSession(model_path)
        """
        logger.warning("Using STUB model loader - replace with actual implementation")
        
        class StubModel:
            def __init__(self, path):
                self.path = path
                self.version = "1.0-stub"
            
            def predict(self, image_tensor):
                """Stub prediction - replace with real model inference"""
                return {
                    "acne": 0.15,
                    "redness": 0.25,
                    "pigmentation": 0.10,
                    "wrinkles": 0.30,
                    "uneven_tone": 0.20,
                    "rash": 0.05
                }
        
        return StubModel(model_path)
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about loaded provider"""
        return {
            'model_loaded': self._model is not None,
            'provider_cache': self._provider_cache
        }


# Singleton instance
model_loader = MLModelLoader()"""ML Model Loader Service - External Model Management

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
