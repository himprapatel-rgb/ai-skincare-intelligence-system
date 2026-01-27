"""
Google OAuth Service for social login.
Sprint: Final Features - Google OAuth Integration
"""
import logging
from typing import Optional, Dict, Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"


class GoogleAuthService:
    """Service for Google OAuth authentication."""
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/auth/google/callback"
    
    async def exchange_code_for_tokens(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access and ID tokens."""
        if not self.client_id or not self.client_secret:
            logger.error("Google OAuth not configured")
            return None
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.redirect_uri,
                    },
                    timeout=30.0,
                )
                
                if response.status_code != 200:
                    logger.error(f"Google token exchange failed: {response.text}")
                    return None
                
                return response.json()
            except Exception as e:
                logger.error(f"Google token exchange error: {e}")
                return None
    
    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30.0,
                )
                
                if response.status_code != 200:
                    logger.error(f"Google userinfo failed: {response.text}")
                    return None
                
                return response.json()
            except Exception as e:
                logger.error(f"Google userinfo error: {e}")
                return None
    
    async def verify_and_get_user(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Complete OAuth flow: exchange code and get user info.
        Returns user data: email, name, picture, email_verified
        """
        # Exchange code for tokens
        tokens = await self.exchange_code_for_tokens(code)
        if not tokens:
            return None
        
        access_token = tokens.get("access_token")
        if not access_token:
            logger.error("No access token in Google response")
            return None
        
        # Get user info
        user_info = await self.get_user_info(access_token)
        if not user_info:
            return None
        
        return {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
            "email_verified": user_info.get("email_verified", False),
            "google_id": user_info.get("sub"),
        }


# Singleton instance
google_auth_service = GoogleAuthService()
