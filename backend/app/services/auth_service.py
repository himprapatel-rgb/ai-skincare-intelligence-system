"""
Authentication service with password hashing.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class AuthService:
    """Service for authentication operations."""

    def __init__(self):
        self.ph = PasswordHasher()

    def hash_password(self, password: str) -> str:
        """Hash password using Argon2id."""
        return self.ph.hash(password)

    def verify_password(self, hashed: str, password: str) -> bool:
        """Verify password against hash."""
        try:
            self.ph.verify(hashed, password)
            return True
        except VerifyMismatchError:
            return False

    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = self.hash_password(user_data.password)

        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    def get_user_by_email(self, db: Session, email: str) -> User | None:
        """Get user by email address."""
        return db.query(User).filter(User.email == email).first()


# Create service instance
auth_service = AuthService()


# Test-only: accept token in form "test_token_<email>" for tests.
# Production auth uses JWT via app.core.security.get_current_user.
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db

_security = HTTPBearer(auto_error=False)


def get_current_user_test_token(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: Session = Depends(get_db),
) -> User:
    """Test-only: validate Bearer token as test_token_<email>. Do not use in app routes."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )
    token = credentials.credentials
    if not token.startswith("test_token_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    email = token.replace("test_token_", "")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user

