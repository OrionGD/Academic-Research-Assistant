from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PaymentEvent(BaseModel):
    type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class PaymentStatus(str):
    CREATED = "created"
    PAID = "paid"
    FAILED = "failed"

class PaymentDB(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    order_id: str
    payment_id: Optional[str] = None
    signature: Optional[str] = None
    amount: int  # in paise
    plan: str
    billing_cycle: str
    status: str = PaymentStatus.CREATED
    last_payment_at: Optional[datetime] = None
    events: List[PaymentEvent] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
