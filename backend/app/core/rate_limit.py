"""
Simple in-memory rate limiting for auth endpoints.
Use per-IP limits to mitigate brute-force and credential stuffing.
"""
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

# 10 login attempts per IP per 15 minutes
LOGIN_MAX_ATTEMPTS = 10
LOGIN_WINDOW_SECONDS = 15 * 60

_login_attempts: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _get_client_ip(request: Request) -> str:
    """Prefer X-Forwarded-For when behind a proxy (e.g. Railway), else client host."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host or "unknown"
    return "unknown"


def _prune_old(attempts: list[float], window_sec: float) -> list[float]:
    now = time.monotonic()
    cutoff = now - window_sec
    return [t for t in attempts if t > cutoff]


def check_login_rate_limit(request: Request) -> None:
    """
    Raise 429 if this IP has exceeded login attempt limit.
    Call this at the start of the login handler.
    """
    ip = _get_client_ip(request)
    now = time.monotonic()
    with _lock:
        attempts = _login_attempts[ip]
        attempts = _prune_old(attempts, LOGIN_WINDOW_SECONDS)
        _login_attempts[ip] = attempts
        if len(attempts) >= LOGIN_MAX_ATTEMPTS:
            oldest = min(attempts)
            retry_after_sec = max(1, int(LOGIN_WINDOW_SECONDS - (now - oldest)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
                headers={"Retry-After": str(retry_after_sec)},
            )


def record_login_attempt(request: Request) -> None:
    """Record a login attempt for this IP. Call after checking credentials."""
    ip = _get_client_ip(request)
    with _lock:
        _login_attempts[ip].append(time.monotonic())
