# Rate Limiting Middleware for Sprint 2 Phase 3
# Uses shared store (Redis when REDIS_URL set) for multi-worker / multi-instance deployments.

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.rate_limit_store import check_and_increment


def _get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.
    Prefer authenticated user_id, fallback to IP (including X-Forwarded-For when behind proxy).
    """
    if hasattr(request.state, "user") and request.state.user is not None:
        return f"user_{request.state.user.id}"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_host = forwarded.split(",")[0].strip()
    elif request.client:
        client_host = request.client.host or "unknown"
    else:
        client_host = "unknown"
    return f"ip_{client_host}"


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting for scan endpoints. Uses app.core.rate_limit_store so that:
    - With REDIS_URL: limits are shared across all workers and instances.
    - Without REDIS_URL: in-memory per process (each uvicorn worker has its own limit).
    """

    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/api/v1/scan"):
            return await call_next(request)

        key = _get_user_identifier(request)
        allowed = await check_and_increment(
            key, self.window_seconds, self.max_requests
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(self.window_seconds)},
            )
        return await call_next(request)
