"""
Authentication middleware
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import HTTPException, status
from app.core.security import verify_token
import re


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for certain paths
        if self._should_skip_auth(request):
            return await call_next(request)
        
        # Check for token in headers
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header"
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            payload = verify_token(token)
            request.state.user_id = payload.get("sub")
            request.state.user_payload = payload
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        
        return await call_next(request)
    
    def _should_skip_auth(self, request: Request) -> bool:
        """Check if request should skip authentication"""
        path = request.url.path
        
        # Public paths
        public_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/"
        ]
        
        # Check exact matches
        if path in public_paths:
            return True
        
        # Check pattern matches (e.g., /docs/*)
        for public_path in public_paths:
            if public_path.endswith("*") and path.startswith(public_path[:-1]):
                return True
        
        return False