from fastapi import Request, HTTPException, Depends, status
from ..models.enums import UserRole
from typing import Optional, Dict, Any

async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Enterprise-grade dependency to retrieve the authenticated user from request state.
    This dependency should be used by any route requiring authentication.
    """
    user = getattr(request.state, "user", None)
    
    # Check if user exists and is not a guest
    if not user or user.get("role") == UserRole.GUEST:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Cookie"},
        )
    
    return user

async def get_admin_user(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency to restrict access to admin users only.
    """
    if user.get("role") != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
    return user

def require_plan(min_plan: str):
    """
    Parameterizable dependency to enforce plan-based access control.
    """
    async def plan_dependency(user: Dict[str, Any] = Depends(get_current_user)):
        # Implementation of plan hierarchy check
        plan_hierarchy = {"BASIC": 1, "PREMIUM": 2, "ENTERPRISE": 3}
        user_plan = str(user.get("plan", "BASIC")).upper()
        
        if plan_hierarchy.get(user_plan, 0) < plan_hierarchy.get(min_plan.upper(), 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires a {min_plan} plan or higher."
            )
        return user
    return plan_dependency
