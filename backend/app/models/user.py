from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class PlanType(str, Enum):
    FREE = "free"
    BASIC = "basic"
    STANDARD = "standard"
    PRO = "pro"

class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: UserRole = UserRole.USER
    plan: PlanType = PlanType.FREE
    billing_cycle: Optional[BillingCycle] = None
    subscription_expires_at: Optional[datetime] = None
    last_payment_at: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
