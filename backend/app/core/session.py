from datetime import datetime, timedelta
from typing import Dict, List, Optional
from jose import jwt, JWTError
from fastapi import HTTPException, status
import redis.asyncio as redis
import json
import secrets
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Multi-device session management with Redis-backed storage.

    SRS Traceability:
    - FR44: Allow users to delete history, disable storage, opt out
    - FR45: AI Transparency
    - NFR4: AES-256 encryption, TLS
    - NFR16: Cross-device consistency

    Sprint: 1.2 - Story 1.1.2
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.max_devices = 5
        self.session_ttl = timedelta(days=7)
        self.access_token_ttl = timedelta(hours=1)
        self.refresh_token_ttl = timedelta(days=30)

    async def create_session(
        self, user_id: str, device_info: Dict[str, str]
    ) -> Dict[str, str]:
        """
        Create new session for user on specific device.

        Returns: {access_token, refresh_token, expires_in}
        """
        # Check active device count
        active_sessions = await self.get_active_sessions(user_id)

        if len(active_sessions) >= self.max_devices:
            # Remove oldest inactive session
            await self.cleanup_inactive_sessions(user_id)

        # Generate tokens
        access_token = self._create_access_token(user_id)
        refresh_token = self._create_refresh_token(user_id)

        # Store session in Redis
        device_id = device_info.get("device_id") or secrets.token_urlsafe(16)
        session_key = f"session:{user_id}:{device_id}"

        session_data = {
            "user_id": user_id,
            "device_info": device_info,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "created_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat(),
        }

        await self.redis.setex(
            session_key, int(self.session_ttl.total_seconds()), json.dumps(session_data)
        )

        logger.info(
            f"Session created for user {user_id} on device {device_id}",
            extra={"user_id": user_id, "device_id": device_id},
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": int(self.access_token_ttl.total_seconds()),
        }

    async def get_active_sessions(self, user_id: str) -> List[str]:
        """
        Get all active session keys for a user.
        """
        pattern = f"session:{user_id}:*"
        keys = await self.redis.keys(pattern)
        return [key.decode("utf-8") if isinstance(key, bytes) else key for key in keys]

    async def cleanup_inactive_sessions(self, user_id: str):
        """
        Remove sessions inactive for >30 days.
        """
        sessions = await self.get_active_sessions(user_id)
        inactive_threshold = datetime.utcnow() - timedelta(days=30)

        for session_key in sessions:
            session_data_str = await self.redis.get(session_key)
            if session_data_str:
                session_data = json.loads(session_data_str)
                last_active = datetime.fromisoformat(session_data["last_active"])

                if last_active < inactive_threshold:
                    await self.redis.delete(session_key)
                    logger.info(f"Removed inactive session: {session_key}")

    async def terminate_session(self, user_id: str, device_id: str):
        """
        Logout specific device.
        """
        session_key = f"session:{user_id}:{device_id}"
        await self.redis.delete(session_key)
        logger.info(f"Session terminated: {session_key}")

    async def terminate_all_sessions(self, user_id: str):
        """
        Logout all devices.
        """
        sessions = await self.get_active_sessions(user_id)
        for session_key in sessions:
            await self.redis.delete(session_key)
        logger.info(f"All sessions terminated for user {user_id}")

    async def sync_profile_update(self, user_id: str, profile_data: Dict):
        """
        Broadcast profile update to all active devices via WebSocket/PubSub.

        SRS: NFR16 - Cross-device consistency
        """
        # Publish to Redis PubSub channel
        await self.redis.publish(
            f"profile_update:{user_id}",
            json.dumps(
                {
                    "type": "profile_updated",
                    "data": profile_data,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        )

    def _create_access_token(self, user_id: str) -> str:
        """
        Create JWT access token.
        """
        payload = {
            "sub": user_id,
            "type": "access",
            "exp": datetime.utcnow() + self.access_token_ttl,
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    def _create_refresh_token(self, user_id: str) -> str:
        """
        Create JWT refresh token.
        """
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.utcnow() + self.refresh_token_ttl,
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
