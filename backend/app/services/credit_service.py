import logging
from typing import Dict, Any, Optional
from ..services.session_service import SessionService
from ..config.database import get_database

logger = logging.getLogger(__name__)

class CreditService:
    @staticmethod
    async def check_and_deduct(user_data: Dict[str, Any], resource_type: str, session_id: Optional[str] = None) -> bool:
        """
        Check if user has enough credits/limits and deduct.
        resource_type: 'docs' or 'chat'
        """
        user_id = user_data.get("user_id")
        plan = user_data.get("plan", "free")
        
        # Admin has no limits
        if user_data.get("role") == "admin":
            return True

        usage_limits = user_data.get("usage_limits", {})
        current_usage = usage_limits.get(resource_type, 0)
        
        # Define limits per plan
        LIMITS = {
            "free": {"docs": 3, "chat": 10},
            "basic": {"docs": 20, "chat": 100},
            "standard": {"docs": 50, "chat": 500},
            "pro": {"docs": 1000, "chat": 10000}
        }
        
        # If user has no usage_limits yet (e.g. first time), initialize from LIMITS
        if resource_type not in usage_limits:
            current_usage = LIMITS.get(plan, LIMITS["free"]).get(resource_type, 0)
        
        if current_usage <= 0:
            logger.warning(f"User {user_id} has exhausted {resource_type} limits.")
            return False
            
        # Deduct
        new_usage = current_usage - 1
        usage_limits[resource_type] = new_usage
        
        # Update DB for registered users
        if not user_id.startswith("guest_"):
            try:
                db = get_database()
                await db.users.update_one(
                    {"_id": user_id},
                    {"$set": {f"usage_limits.{resource_type}": new_usage}}
                )
            except Exception as e:
                logger.error(f"Failed to update user {user_id} limits in DB: {e}")
            
        # Update session if session_id is provided
        if session_id:
            try:
                await SessionService.update_session(session_id, {"usage_limits": usage_limits})
            except Exception as e:
                logger.error(f"Failed to update session {session_id} limits: {e}")
                
        return True

    @staticmethod
    async def get_current_limits(user_data: Dict[str, Any]) -> Dict[str, int]:
        return user_data.get("usage_limits", {"docs": 0, "chat": 0})
