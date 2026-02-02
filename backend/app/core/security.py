"""
Security Module
Handles authentication, authorization, and security utilities.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session
import redis

from app.core.config import settings
from app.database.models import User, Institution, APIKey
from app.database.crud import user_crud, institution_crud, api_key_crud
from app.database.session import get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# HTTP Bearer scheme for API keys
api_key_scheme = HTTPBearer(auto_error=False)

# Redis connection for token blacklisting
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    db=settings.REDIS_DB,
    decode_responses=True
)


class SecurityManager:
    """Security manager for authentication and authorization"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(
        user_id: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT refresh token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "type": "refresh"
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_api_key(
        user_id: str,
        institution_id: Optional[str] = None,
        scopes: Optional[list] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create API key"""
        api_key = secrets.token_urlsafe(32)
        key_id = secrets.token_urlsafe(16)
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=365)  # 1 year by default
        
        # Store in database
        with next(get_db()) as db:
            api_key_record = APIKey(
                id=key_id,
                key_hash=SecurityManager.get_password_hash(api_key),
                user_id=user_id,
                institution_id=institution_id,
                scopes=scopes or ["read", "write"],
                expires_at=expire,
                is_active=True
            )
            db.add(api_key_record)
            db.commit()
        
        return f"{key_id}.{api_key}"
    
    @staticmethod
    def verify_api_key(api_key: str, db: Session) -> Optional[APIKey]:
        """Verify API key"""
        try:
            key_id, key = api_key.split(".", 1)
        except ValueError:
            return None
        
        # Get API key record
        api_key_record = api_key_crud.get(db, key_id)
        if not api_key_record or not api_key_record.is_active:
            return None
        
        # Check expiration
        if api_key_record.expires_at and api_key_record.expires_at < datetime.utcnow():
            return None
        
        # Verify key
        if not SecurityManager.verify_password(key, api_key_record.key_hash):
            return None
        
        return api_key_record
    
    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def is_token_blacklisted(token: str) -> bool:
        """Check if token is blacklisted"""
        return redis_client.exists(f"blacklist:{token}") == 1
    
    @staticmethod
    def blacklist_token(token: str, expires_in: int = 86400) -> None:
        """Add token to blacklist (24 hours by default)"""
        redis_client.setex(f"blacklist:{token}", expires_in, "1")
    
    @staticmethod
    def validate_scopes(
        required_scopes: list,
        user_scopes: list
    ) -> bool:
        """Check if user has required scopes"""
        if "admin" in user_scopes:
            return True
        
        return all(scope in user_scopes for scope in required_scopes)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    api_key: Optional[HTTPAuthorizationCredentials] = Depends(api_key_scheme)
) -> User:
    """Dependency to get current authenticated user"""
    # Try API key authentication first
    if api_key and api_key.credentials:
        api_key_record = SecurityManager.verify_api_key(api_key.credentials, db)
        if api_key_record:
            user = user_crud.get(db, api_key_record.user_id)
            if user:
                user.scopes = api_key_record.scopes
                user.api_key_id = api_key_record.id
                return user
    
    # Try JWT token authentication
    if token:
        # Check if token is blacklisted
        if SecurityManager.is_token_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        payload = SecurityManager.decode_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_crud.get(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get current admin user"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


def get_current_institution_admin(
    institution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Institution:
    """Dependency to check if user is institution admin"""
    if current_user.role == "admin":
        # Super admin can access any institution
        institution = institution_crud.get(db, institution_id)
        if institution:
            return institution
    
    # Check if user is admin of this institution
    institution = institution_crud.get_by_admin(db, institution_id, current_user.id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this institution"
        )
    
    return institution


def require_scopes(required_scopes: list):
    """Dependency to require specific scopes"""
    def scope_dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_scopes = getattr(current_user, "scopes", [])
        
        if not SecurityManager.validate_scopes(required_scopes, user_scopes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required scopes: {required_scopes}"
            )
        
        return current_user
    
    return scope_dependency


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "password_reset":
            return None
        
        return email
    except JWTError:
        return None


def create_password_reset_token(email: str) -> str:
    """Create password reset token"""
    expires = timedelta(hours=1)
    to_encode = {"sub": email, "type": "password_reset", "exp": datetime.utcnow() + expires}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_email_verification_token(email: str) -> str:
    """Create email verification token"""
    expires = timedelta(hours=24)
    to_encode = {"sub": email, "type": "email_verify", "exp": datetime.utcnow() + expires}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


class RateLimiter:
    """Rate limiting implementation using Redis"""
    
    def __init__(self, requests_per_minute: int = 60, burst_size: int = 10):
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.redis_client = redis_client
    
    async def is_rate_limited(self, key: str) -> bool:
        """Check if request is rate limited"""
        if not settings.RATE_LIMIT_ENABLED:
            return False
        
        current = self.redis_client.get(key)
        
        if current is None:
            # First request, set counter with expiration
            self.redis_client.setex(key, 60, 1)
            return False
        
        current_count = int(current)
        
        if current_count >= self.requests_per_minute + self.burst_size:
            return True
        
        # Increment counter
        self.redis_client.incr(key)
        if current_count == 1:
            # Set expiration on first increment
            self.redis_client.expire(key, 60)
        
        return False
    
    def get_client_key(self, client_ip: str, endpoint: str) -> str:
        """Generate rate limit key for client"""
        return f"rate_limit:{client_ip}:{endpoint}"


# Initialize security manager
security_manager = SecurityManager()

# Initialize rate limiter
rate_limiter = RateLimiter(
    requests_per_minute=settings.RATE_LIMIT_REQUESTS_PER_MINUTE,
    burst_size=settings.RATE_LIMIT_BURST_SIZE
)