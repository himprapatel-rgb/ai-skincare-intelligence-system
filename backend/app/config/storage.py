"""Storage configuration for ML model cache management.

Handles persistent volume configuration, cache statistics, and directory management
for external pre-trained ML models.

Epic 16: External Pre-Trained ML Model Integration
Story 16.1: Configure Railway Volume for ML Models
"""

import os
from pathlib import Path
from typing import Dict


class StorageConfig:
    """Configuration for ML model storage on Railway persistent volume."""
    
    # Volume mount path from environment variable
    MODEL_CACHE_DIR = Path(os.getenv("EXTERNAL_MODEL_CACHE_DIR", "/app/model_cache"))
    
    # Cache settings
    CACHE_TTL_HOURS = int(os.getenv("MODEL_CACHE_TTL_HOURS", "24"))
    CACHE_MAX_SIZE_GB = int(os.getenv("MODEL_CACHE_MAX_SIZE_GB", "10"))
    
    # Loading settings
    LOAD_TIMEOUT = int(os.getenv("MODEL_LOAD_TIMEOUT_SECONDS", "30"))
    WARMUP_ON_STARTUP = os.getenv("MODEL_WARMUP_ON_STARTUP", "false").lower() == "true"
    
    @classmethod
    def ensure_cache_dir_exists(cls) -> None:
        """Create cache directory if it doesn't exist.
        
        Creates the directory with parent directories and sets appropriate permissions.
        """
        try:
            cls.MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            print(f"✅ Model cache directory ready: {cls.MODEL_CACHE_DIR}")
        except Exception as e:
            print(f"❌ Error creating cache directory: {e}")
            raise
    
    @classmethod
    def get_cache_stats(cls) -> Dict[str, any]:
        """Get cache directory statistics.
        
        Returns:
            Dictionary containing:
                - size_mb: Total size in megabytes
                - files: Number of files
                - path: Directory path
                - available_space_gb: Available space in GB
        """
        if not cls.MODEL_CACHE_DIR.exists():
            return {
                "size_mb": 0,
                "files": 0,
                "path": str(cls.MODEL_CACHE_DIR),
                "available_space_gb": 0
            }
        
        try:
            # Calculate total size
            total_size = sum(
                f.stat().st_size 
                for f in cls.MODEL_CACHE_DIR.rglob('*') 
                if f.is_file()
            )
            
            # Count files
            file_count = sum(
                1 for _ in cls.MODEL_CACHE_DIR.rglob('*') 
                if _.is_file()
            )
            
            # Get available space
            stat = os.statvfs(cls.MODEL_CACHE_DIR)
            available_space = (stat.f_bavail * stat.f_frsize) / (1024**3)  # GB
            
            return {
                "size_mb": round(total_size / (1024 * 1024), 2),
                "files": file_count,
                "path": str(cls.MODEL_CACHE_DIR),
                "available_space_gb": round(available_space, 2)
            }
        except Exception as e:
            print(f"⚠️  Error getting cache stats: {e}")
            return {
                "size_mb": 0,
                "files": 0,
                "path": str(cls.MODEL_CACHE_DIR),
                "error": str(e)
            }
    
    @classmethod
    def clear_cache(cls) -> bool:
        """Clear all files from cache directory.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            for item in cls.MODEL_CACHE_DIR.glob('*'):
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    import shutil
                    shutil.rmtree(item)
            print(f"✅ Cache cleared: {cls.MODEL_CACHE_DIR}")
            return True
        except Exception as e:
            print(f"❌ Error clearing cache: {e}")
            return False
    
    @classmethod
    def is_cache_available(cls) -> bool:
        """Check if cache directory is accessible and writable.
        
        Returns:
            True if cache is available, False otherwise
        """
        try:
            cls.ensure_cache_dir_exists()
            # Test write
            test_file = cls.MODEL_CACHE_DIR / ".test_write"
            test_file.write_text("test")
            test_file.unlink()
            return True
        except Exception as e:
            print(f"❌ Cache not available: {e}")
            return False


# Initialize cache directory on module import
try:
    StorageConfig.ensure_cache_dir_exists()
except Exception as e:
    print(f"⚠️  Warning: Could not initialize cache directory: {e}")
