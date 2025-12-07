# Rate Limiting Middleware for Sprint 2 Phase 3
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
from typing import Dict, Tuple


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse of scan endpoints
    Implements token bucket algorithm with per-user limits
    """
    
    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Store: {user_id: (request_count, window_start_time)}
        self.rate_limit_store: Dict[str, Tuple[int, datetime]] = defaultdict(
            lambda: (0, datetime.now())
        )
        # Start cleanup task
        asyncio.create_task(self._cleanup_old_entries())
    
    async def dispatch(self, request: Request, call_next):
        # Only rate limit scan endpoints
        if not request.url.path.startswith("/api/v1/scan"):
            return await call_next(request)
        
        # Get user identifier (IP or user_id from auth)
        user_id = self._get_user_identifier(request)
        
        # Check rate limit
        if not self._check_rate_limit(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(self.window_seconds)}
            )
        
        response = await call_next(request)
        return response
    
    def _get_user_identifier(self, request: Request) -> str:
        """
        Get unique identifier for rate limiting
        Prefer authenticated user_id, fallback to IP address
        """
        # Try to get user from auth state
        if hasattr(request.state, "user"):
            return f"user_{request.state.user.id}"
        
        # Fallback to IP address
        client_host = request.client.host if request.client else "unknown"
        return f"ip_{client_host}"
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user has exceeded rate limit
        Returns True if request is allowed, False if rate limited
        """
        now = datetime.now()
        request_count, window_start = self.rate_limit_store[user_id]
        
        # Check if window has expired
        if now - window_start > timedelta(seconds=self.window_seconds):
            # Reset window
            self.rate_limit_store[user_id] = (1, now)
            return True
        
        # Check if under limit
        if request_count < self.max_requests:
            self.rate_limit_store[user_id] = (request_count + 1, window_start)
            return True
        
        # Rate limit exceeded
        return False
    
    async def _cleanup_old_entries(self):
        """
        Periodic cleanup of expired rate limit entries
        Runs every 5 minutes to prevent memory leaks
        """
        while True:
            await asyncio.sleep(300)  # 5 minutes
            now = datetime.now()
            expired_keys = [
                key for key, (_, window_start) in self.rate_limit_store.items()
                if now - window_start > timedelta(seconds=self.window_seconds * 2)
            ]
            for key in expired_keys:
                del self.rate_limit_store[key]
