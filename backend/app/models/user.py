"""
User models
"""
from typing import Optional, List
from enum import Enum
from pydantic import EmailStr, Field
from .base import BaseMongoModel


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    RESEARCHER = "researcher"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class UserBase(BaseMongoModel):
    email: EmailStr
    firebase_uid: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    preferences: dict = Field(default_factory=dict)


class UserCreate(BaseMongoModel):
    email: EmailStr
    firebase_uid: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserUpdate(BaseMongoModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    preferences: Optional[dict] = None


class UserInDB(UserBase):
    pass