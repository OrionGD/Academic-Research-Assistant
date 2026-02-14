"""
Authentication middleware - USING ONLY FIREBASE TOKENS
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import HTTPException, status
from app.services.firebase import FirebaseService

firebase_service = FirebaseService.get_instance()


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
                detail="Missing or invalid authorization header. Use: Bearer <firebase_token>"
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify Firebase token
            decoded_token = await firebase_service.verify_token(token)
            firebase_uid = decoded_token.get("uid")
            
            if not firebase_uid:
                raise ValueError("No UID in token")
            
            # Attach Firebase UID to request state
            request.state.firebase_uid = firebase_uid
            request.state.firebase_token = token
            request.state.firebase_payload = decoded_token
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Firebase token: {str(e)}"
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
            "/metrics",
            "/api/v1/auth/login",
            "/api/v1/auth/verify-token",
            "/api/v1/auth/register",
            "/"
        ]
        
        # Check exact matches
        if path in public_paths:
            return True
        
        # Check pattern matches
        for public_path in public_paths:
            if public_path.endswith("*") and path.startswith(public_path[:-1]):
                return True
        
        return False
