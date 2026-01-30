"""
Request Tracing Middleware (Task 425)
Adds correlation IDs for request tracing and logging
"""
import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds correlation IDs to all requests for tracing.
    
    Features:
    - Generates unique request ID for each request
    - Accepts incoming X-Request-ID header or generates new one
    - Adds request ID to response headers
    - Logs request duration and status
    """
    
    HEADER_NAME = "X-Request-ID"
    HEADER_DURATION = "X-Response-Time"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate request ID
        request_id = request.headers.get(self.HEADER_NAME)
        if not request_id:
            request_id = str(uuid.uuid4())[:8]  # Short ID for readability
        
        # Store in request state for use in handlers
        request.state.request_id = request_id
        
        # Track request start time
        start_time = time.time()
        
        # Log request start
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - Started",
            extra={"request_id": request_id, "method": request.method, "path": request.url.path}
        )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error with request ID
            duration = time.time() - start_time
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} - Error after {duration:.3f}s: {str(e)}",
                extra={"request_id": request_id, "duration": duration, "error": str(e)}
            )
            raise
        
        # Calculate duration
        duration = time.time() - start_time
        duration_ms = int(duration * 1000)
        
        # Add tracing headers to response
        response.headers[self.HEADER_NAME] = request_id
        response.headers[self.HEADER_DURATION] = f"{duration_ms}ms"
        
        # Log request completion
        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            log_level,
            f"[{request_id}] {request.method} {request.url.path} - {response.status_code} in {duration:.3f}s",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration
            }
        )
        
        return response


class RequestContextLogger:
    """
    Context-aware logger that includes request ID in all log messages.
    Usage: logger = RequestContextLogger(request)
    """
    
    def __init__(self, request: Request):
        self.request_id = getattr(request.state, 'request_id', 'unknown')
        self._logger = logging.getLogger(__name__)
    
    def _format(self, message: str) -> str:
        return f"[{self.request_id}] {message}"
    
    def info(self, message: str, **kwargs):
        self._logger.info(self._format(message), **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._logger.warning(self._format(message), **kwargs)
    
    def error(self, message: str, **kwargs):
        self._logger.error(self._format(message), **kwargs)
    
    def debug(self, message: str, **kwargs):
        self._logger.debug(self._format(message), **kwargs)
