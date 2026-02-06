"""
Performance logging middleware - log slow requests for monitoring.
"""
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Log requests slower than this threshold (seconds)
SLOW_REQUEST_THRESHOLD = 1.0


class PerformanceLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log request duration and warn on slow requests.
    Helps identify performance bottlenecks in production.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Add timing header for debugging
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        
        # Log slow requests
        if duration > SLOW_REQUEST_THRESHOLD:
            logger.warning(
                "Slow request: %s %s took %.3fs (status %d)",
                request.method,
                request.url.path,
                duration,
                response.status_code,
            )
        
        return response
