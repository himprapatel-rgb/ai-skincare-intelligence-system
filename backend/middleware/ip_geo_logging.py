"""
Middleware to record client IP and geolocation on each request and update the database.
Updates User.last_ip_address, last_geolocation, last_seen_at and inserts UserAccessLog.
"""
import logging
from datetime import datetime, timezone
from typing import Callable

from jose import JWTError, jwt
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.geo import fetch_geolocation, get_client_ip
from app.core.security import ALGORITHM, SECRET_KEY
from app.database import SessionLocal
from app.models.user import User, UserAccessLog

logger = logging.getLogger(__name__)


def _get_user_id_from_token(token: str) -> int | None:
    """Decode JWT and return user id if valid. Returns None on invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            return None
        if sub.isdigit():
            return int(sub)
        # sub can be email; we need user id for FK - look up in DB
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == sub).first()
            return user.id if user else None
        finally:
            db.close()
    except JWTError:
        return None


def _record_ip_and_geo(user_id: int, ip: str, geo: dict | None) -> None:
    """Update User and insert UserAccessLog. Swallow errors so request is never broken."""
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        now = datetime.now(timezone.utc)
        user.last_ip_address = ip
        user.last_geolocation = geo
        user.last_seen_at = now
        db.add(user)
        log = UserAccessLog(
            user_id=user_id,
            ip_address=ip,
            geolocation=geo,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning("IP/geo logging failed: %s", e)
        db.rollback()
    finally:
        db.close()


class IPGeoLoggingMiddleware(BaseHTTPMiddleware):
    """Record IP and geolocation on each authenticated API request; update User and UserAccessLog."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        if not request.url.path.startswith("/api/"):
            return response
        auth = request.headers.get("authorization")
        if not auth or not auth.lower().startswith("bearer "):
            return response
        token = auth.split(" ", 1)[1].strip()
        if not token:
            return response

        user_id = _get_user_id_from_token(token)
        if not user_id:
            return response

        ip = get_client_ip(request)
        geo = fetch_geolocation(ip)
        try:
            _record_ip_and_geo(user_id, ip, geo)
        except Exception as e:
            logger.debug("IP/geo record error: %s", e)

        return response
