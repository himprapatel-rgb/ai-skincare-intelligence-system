# File Cleanup Middleware for Sprint 2 Phase 3
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import os
import tempfile
from pathlib import Path
import logging
from typing import Set
import atexit

logger = logging.getLogger(__name__)


class FileCleanupMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track and cleanup temporary files after request processing
    Prevents disk space issues from accumulated scan uploads
    """
    
    def __init__(self, app, temp_dir: str = None):
        super().__init__(app)
        self.temp_dir = temp_dir or tempfile.gettempdir()
        # Track files created during request
        self.tracked_files: Set[str] = set()
        # Register cleanup on app shutdown
        atexit.register(self._cleanup_all)
    
    async def dispatch(self, request: Request, call_next):
        # Track files before processing
        request.state.temp_files = set()
        
        try:
            response = await call_next(request)
            return response
        finally:
            # Cleanup files after response is sent
            await self._cleanup_request_files(request)
    
    async def _cleanup_request_files(self, request: Request):
        """
        Clean up temporary files created during request processing
        """
        if not hasattr(request.state, "temp_files"):
            return
        
        for file_path in request.state.temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.debug(f"Cleaned up temporary file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file {file_path}: {e}")
    
    def _cleanup_all(self):
        """
        Cleanup all tracked files on application shutdown
        """
        logger.info("Performing final cleanup of temporary files")
        for file_path in self.tracked_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.debug(f"Shutdown cleanup: {file_path}")
            except Exception as e:
                logger.error(f"Error in shutdown cleanup {file_path}: {e}")
        self.tracked_files.clear()
    
    @staticmethod
    def register_temp_file(request: Request, file_path: str):
        """
        Register a temporary file for cleanup after request
        Call this from your route handlers
        
        Usage:
            temp_file = "/tmp/uploaded_image.jpg"
            FileCleanupMiddleware.register_temp_file(request, temp_file)
        """
        if not hasattr(request.state, "temp_files"):
            request.state.temp_files = set()
        request.state.temp_files.add(file_path)
    
    @staticmethod
    def cleanup_directory(directory: str, pattern: str = "*", max_age_hours: int = 24):
        """
        Cleanup old files in a directory
        Useful for periodic cleanup of scan upload directories
        
        Args:
            directory: Directory to clean
            pattern: File pattern to match (default: all files)
            max_age_hours: Remove files older than this many hours
        """
        import time
        from datetime import datetime, timedelta
        
        try:
            path = Path(directory)
            if not path.exists():
                return
            
            cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
            cutoff_timestamp = cutoff_time.timestamp()
            
            for file_path in path.glob(pattern):
                if file_path.is_file():
                    file_age = os.path.getmtime(file_path)
                    if file_age < cutoff_timestamp:
                        try:
                            file_path.unlink()
                            logger.info(f"Cleaned up old file: {file_path}")
                        except Exception as e:
                            logger.error(f"Error cleaning {file_path}: {e}")
        except Exception as e:
            logger.error(f"Error in directory cleanup: {e}")
