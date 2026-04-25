from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime

class AuditLogBase(BaseModel):
    action: str
    actor_id: Optional[str] = None
    target_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogDB(AuditLogBase):
    id: str = Field(alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
