"""
Logging middleware
"""
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import logging

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log request
        log_data = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": f"{process_time:.3f}s",
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }
        
        # Add user ID if available
        if hasattr(request.state, "user_id"):
            log_data["user_id"] = request.state.user_id
        
        # Log based on status code
        if response.status_code >= 500:
            logger.error(log_data)
        elif response.status_code >= 400:
            logger.warning(log_data)
        else:
            logger.info(log_data)
        
        return response