"""
Authentication endpoints - USING ONLY FIREBASE TOKENS
"""
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.firebase import FirebaseService
from app.db.mongodb import users
from app.models.user import UserCreate
from app.core.dependencies import get_current_user

router = APIRouter()
security = HTTPBearer()
firebase_service = FirebaseService.get_instance()


@router.post("/login")
async def login(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Login with Firebase token - NO JWT generation"""
    try:
        # Verify Firebase token
        decoded_token = await firebase_service.verify_token(credentials.credentials)
        firebase_uid = decoded_token.get("uid")
        
        # Check if user exists in our database
        user = await users.find_one({"firebase_uid": firebase_uid})
        
        if not user:
            # Create new user in our database
            user_data = UserCreate(
                email=decoded_token.get("email"),
                firebase_uid=firebase_uid,
                display_name=decoded_token.get("name"),
                photo_url=decoded_token.get("picture")
            )
            result = await users.insert_one(user_data.dict(by_alias=True))
            user = await users.find_one({"_id": result.inserted_id})
        
        return {
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "display_name": user.get("display_name"),
                "photo_url": user.get("photo_url"),
                "role": user.get("role", "user"),
                "firebase_uid": user["firebase_uid"]
            },
            "firebase_token": credentials.credentials  # Return the same Firebase token
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/verify-token")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Verify Firebase token validity"""
    try:
        decoded_token = await firebase_service.verify_token(credentials.credentials)
        
        return {
            "valid": True,
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "expires_at": decoded_token.get("exp")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


# REMOVED refresh token endpoint - Firebase handles token refresh

@router.get("/me")
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current user profile"""
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "display_name": current_user.get("display_name"),
        "photo_url": current_user.get("photo_url"),
        "role": current_user.get("role", "user"),
        "firebase_uid": current_user["firebase_uid"],
        "created_at": current_user.get("created_at")
    }


@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Logout - Client-side token invalidation"""
    # Note: Firebase tokens are stateless. Actual invalidation happens on client side
    # or by revoking tokens in Firebase console if needed
    return {
        "message": "Logged out successfully. Please discard the Firebase token on the client."
    }