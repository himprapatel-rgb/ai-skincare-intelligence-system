from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import os
import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from typing import Union, List

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
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

# JWT Configuration
SECRET_KEY = "your-secret-key-here"  # TODO: Move to environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


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
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


# Sensitive Data Encryption (NFR4: AES-256)

# TODO: Move to environment variables - CRITICAL SECURITY
# This is a placeholder - MUST be replaced with proper key management
ENCRYPTION_KEY = os.getenv(
    "ENCRYPTION_KEY",
    "your-encryption-key-here-must-be-32-bytes-base64-encoded"
)

def _get_fernet():
    """Get Fernet cipher instance with derived key."""
    # Derive a proper 32-byte key from the encryption key
    salt = b'ai-skincare-salt'  # TODO: Store salt securely
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=0,HMAC
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return Fernet(key)

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
        fernet = _get_fernet()
        # Convert to JSON string if not already a string
        if not isinstance(data, str):
            data = json.dumps(data)
        # Encrypt and return as string
        encrypted_bytes = fernet.encrypt(data.encode())
        return encrypted_bytes.decode()
    except Exception as e:
        raise RuntimeError(f"Encryption failed: {str(e)}")

def decrypt_sensitive_data(encrypted_data: str) -> Union[str, List, dict]:
    """
    Decrypt sensitive user data.
    
    Args:
        encrypted_data: Base64-encoded encrypted string
        
    Returns:
        Original data (string, list, or dict)
        
    SRS Traceability:
    - NFR4: Use AES-256 encryption for sensitive data at rest
    """
    try:
        fernet = _get_fernet()
        # Decrypt
        decrypted_bytes = fernet.decrypt(encrypted_data.encode())
        decrypted_str = decrypted_bytes.decode()
        
        # Try to parse as JSON (for lists/dicts)
        try:
            return json.loads(decrypted_str)
        except json.JSONDecodeError:
            # Return as string if not JSON
            return decrypted_str
    except Exception as e:
        raise RuntimeError(f"Decryption failed: {str(e)}")
