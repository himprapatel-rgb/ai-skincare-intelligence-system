import base64
import json
import os
from typing import List, Union

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ph = PasswordHasher(
    time_cost=2, memory_cost=65536, parallelism=4, hash_len=32, salt_len=16
)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        ph.verify(hashed, password)
        return True
    except VerifyMismatchError:
        return False



# JWT and Authentication imports
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

_raw_algorithm = settings.ALGORITHM
_allowed_algorithms = {
    "HS256",
    "HS384",
    "HS512",
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
}
if not _raw_algorithm or _raw_algorithm.strip().startswith("${"):
    ALGORITHM = "HS256"
elif _raw_algorithm not in _allowed_algorithms:
    raise RuntimeError(f"Unsupported JWT algorithm: {_raw_algorithm}")
else:
    ALGORITHM = _raw_algorithm

if settings.ENV == "production" and SECRET_KEY == "dev-secret-key-change-in-production":
    raise RuntimeError("SECRET_KEY must be set for production.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject: str | None = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if subject.isdigit():
        user = db.query(User).filter(User.id == int(subject)).first()
    else:
        user = db.query(User).filter(User.email == subject).first()
    if user is None:
        raise credentials_exception
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email.",
        )
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None (allows guest access)"""
    if token is None:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject: str | None = payload.get("sub")
        if subject is None:
            return None
            
        if subject.isdigit():
            user = db.query(User).filter(User.id == int(subject)).first()
        else:
            user = db.query(User).filter(User.email == subject).first()
        if user and not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email.",
            )
        return user
    except JWTError:
        return None


def _get_admin_allowlist() -> tuple[set[str], bool]:
    """Return (allowlist, allow_all). allow_all=True means any is_admin user can access (testing only)."""
    raw = settings.ADMIN_EMAIL_ALLOWLIST or ""
    if raw.strip().lower() == "*":
        return set(), True
    return {item.strip().lower() for item in raw.split(",") if item.strip()}, False


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is an admin and in allowlist (or allow_all for testing)."""
    allowlist, allow_all = _get_admin_allowlist()
    if not allow_all and not allowlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is not configured.",
        )
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access denied.",
        )
    if not allow_all and current_user.email.lower() not in allowlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access denied.",
        )
    return current_user


# Sensitive Data Encryption (NFR4: AES-256)

# TODO: Move to environment variables - CRITICAL SECURITY
# This is a placeholder - MUST be replaced with proper key management
ENCRYPTION_KEY = os.getenv(
    "ENCRYPTION_KEY",
    "your-encryption-key-here-must-be-32-bytes-base64-encoded"
)

# Cached Fernet instance to prevent CPU exhaustion (Gemini AI recommendation)
_FERNET_INSTANCE = None

def get_fernet():
    """Get cached Fernet cipher instance with derived key."""
    global _FERNET_INSTANCE
    if _FERNET_INSTANCE:
        return _FERNET_INSTANCE
    
    # Get encryption key and salt from environment
    key_str = os.getenv("ENCRYPTION_KEY")
    salt_str = os.getenv("ENCRYPTION_SALT")
    
    # Validate environment variables in production
    if not key_str or not salt_str:
        if os.getenv("ENV") == "production":
            raise RuntimeError("ENCRYPTION_KEY or ENCRYPTION_SALT not set!")
        # Development fallback
        key_str = "development-key-must-be-32-chars-long-"
        salt_str = "dev-salt"
    
    # Derive key using PBKDF2 (only once at startup)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt_str.encode(),
        iterations=100000,
        backend=default_backend()
    )
    derived_key = base64.urlsafe_b64encode(kdf.derive(key_str.encode()))
    _FERNET_INSTANCE = Fernet(derived_key)
    return _FERNET_INSTANCE
def encrypt_sensitive_data(data: Union[str, List, dict]) -> str:
    """
    Encrypt sensitive user data using AES-256 encryption.
    
    Args:
        data: String, list, or dict to encrypt
        
    Returns:
        Base64-encoded encrypted string
        
    SRS Traceability:
    - NFR4: Use AES-256 encryption for sensitive data at rest
    """
    try:
        fernet = get_fernet()
        # Convert to JSON string if not already a string
        if not isinstance(data, str):
            data = json.dumps(data)
        # Encrypt and return as string
        encrypted_bytes = fernet.encrypt(data.encode())
        return encrypted_bytes.decode()
    except Exception as e:
        raise RuntimeError(f"Encryption failed: {str(e)}")

def decrypt_sensitive_data(encrypted_data: Union[str, List, dict, None]) -> Union[str, List, dict, None]:
    """
    Decrypt sensitive user data.
    
    Args:
        encrypted_data: Base64-encoded encrypted string
        
    Returns:
        Original data (string, list, or dict)
        
    SRS Traceability:
    - NFR4: Use AES-256 encryption for sensitive data at rest
    """
    if encrypted_data is None:
        return None
    if not isinstance(encrypted_data, str):
        return encrypted_data
    try:
        fernet = get_fernet()
        # Decrypt
        decrypted_bytes = fernet.decrypt(encrypted_data.encode())
        decrypted_str = decrypted_bytes.decode()

        # Try to parse as JSON (for lists/dicts)
        try:
            return json.loads(decrypted_str)
        except json.JSONDecodeError:
            # Return as string if not JSON
            return decrypted_str
    except Exception:
        try:
            return json.loads(encrypted_data)
        except json.JSONDecodeError:
            return encrypted_data
