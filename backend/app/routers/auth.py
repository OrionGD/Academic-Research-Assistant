from fastapi import APIRouter, Response, Request, HTTPException, Depends, status
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from ..config.settings import settings
from ..config.database import get_database
from ..services.session_service import SessionService
from ..models.user import UserCreate, UserDB, PlanType, UserRole

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register")
async def register(user_in: UserCreate, response: Response):
    db = get_database()
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_in.password)
    user_data = user_in.dict()
    del user_data["password"]
    user_data["hashed_password"] = hashed_password
    user_data["created_at"] = datetime.utcnow()
    user_data["role"] = UserRole.USER
    user_data["plan"] = PlanType.FREE
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Create session
    session_data = {
        "user_id": user_id,
        "email": user_in.email,
        "role": user_data["role"],
        "plan": user_data["plan"]
    }
    session_id = await SessionService.create_session(session_data)
    
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"message": "User registered successfully", "user": session_data}

@router.post("/login")
async def login(body: Dict[str, str], response: Response):
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
        
    db = get_database()
    user = await db.users.find_one({"email": email})
    
    if not user or not pwd_context.verify(password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Session data
    session_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "plan": user["plan"]
    }
    session_id = await SessionService.create_session(session_data)
    
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"message": "Logged in successfully", "user": session_data}

@router.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.state.session_id
    if session_id:
        await SessionService.delete_session(session_id)
    response.delete_cookie(settings.SESSION_COOKIE_NAME)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(request: Request):
    user_data = request.state.user
    if not user_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a guest
    if user_data.get("user_id", "").startswith("guest_"):
        return {
            "id": user_data["user_id"],
            "email": "guest@aras.ai",
            "name": "Guest User",
            "role": user_data["role"],
            "plan": user_data["plan"],
            "usage_limits": user_data.get("usage_limits", {})
        }

    # Fetch latest user data from DB for registered users
    db = get_database()
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_data["user_id"])})
    except:
        # If it's not a valid ObjectId (e.g. legacy string ID), try direct match
        user = await db.users.find_one({"_id": user_data["user_id"]})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "role": user["role"],
        "plan": user["plan"],
        "billing_cycle": user.get("billing_cycle"),
        "subscription_expires_at": user.get("subscription_expires_at"),
        "last_payment_at": user.get("last_payment_at"),
        "usage_limits": user.get("usage_limits", {})
    }


@router.put("/profile")
async def update_profile(request: Request, body: Dict[str, str]):
    user_data = request.state.user
    if not user_data or user_data.get("user_id", "").startswith("guest_"):
        raise HTTPException(status_code=401, detail="Authentication required")

    updates = {}
    if body.get("name") is not None:
        updates["name"] = body["name"].strip()
    if body.get("email") is not None:
        updates["email"] = body["email"].strip()

    if not updates:
        raise HTTPException(status_code=400, detail="No profile fields to update")

    db = get_database()
    from bson import ObjectId
    try:
        user_query = {"_id": ObjectId(user_data["user_id"])}
    except Exception:
        user_query = {"_id": user_data["user_id"]}

    await db.users.update_one(user_query, {"$set": updates})
    await SessionService.update_session(request.state.session_id, updates)

    return {"message": "Profile updated successfully", "updatedFields": updates}


@router.post("/change-password")
async def change_password(request: Request, body: Dict[str, str]):
    user_data = request.state.user
    if not user_data or user_data.get("user_id", "").startswith("guest_"):
        raise HTTPException(status_code=401, detail="Authentication required")

    current_password = body.get("currentPassword")
    new_password = body.get("newPassword")
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both currentPassword and newPassword are required")

    db = get_database()
    from bson import ObjectId
    try:
        user_query = {"_id": ObjectId(user_data["user_id"])}
    except Exception:
        user_query = {"_id": user_data["user_id"]}

    user = await db.users.find_one(user_query)
    if not user or not pwd_context.verify(current_password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    await db.users.update_one(user_query, {"$set": {"hashed_password": pwd_context.hash(new_password)}})
    return {"message": "Password changed successfully"}
