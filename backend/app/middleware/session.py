from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import uuid
from ..services.session_service import SessionService
from ..config.settings import settings

class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
        
        request.state.user = None
        request.state.session_id = None

        if session_id:
            user_data = await SessionService.get_session(session_id)
            if user_data:
                request.state.user = user_data
                request.state.session_id = session_id
        
        if not request.state.user:
            # Assign a temporary guest identity and persist it in a session
            guest_id = f"guest_{uuid.uuid4().hex[:8]}"
            guest_data = {
                "user_id": guest_id,
                "role": "guest",
                "plan": "free",
                "usage_limits": {"docs": 3, "chat": 10}
            }
            
            # Create a session for the guest
            new_session_id = await SessionService.create_session(guest_data)
            request.state.user = guest_data
            request.state.session_id = new_session_id
            
            response = await call_next(request)
            
            # Set the cookie for the guest
            response.set_cookie(
                key=settings.SESSION_COOKIE_NAME,
                value=new_session_id,
                max_age=settings.SESSION_EXPIRE_SECONDS,
                httponly=True,
                samesite="lax",
                secure=False # Set to True in production with HTTPS
            )
            return response

        response = await call_next(request)
        return response

    def _is_public_route(self, path: str) -> bool:
        public_routes = ["/api/auth/login", "/api/auth/register", "/api/docs", "/openapi.json"]
        return any(path.startswith(route) for route in public_routes)
