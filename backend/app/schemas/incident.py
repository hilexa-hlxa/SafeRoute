from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IncidentCreate(BaseModel):
    lat: float
    lng: float
    type: str
    description: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    user_id: str
    type: str
    description: Optional[str]
    lat: float
    lng: float
    status: str
    confirm_count: int
    reject_count: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VoteCreate(BaseModel):
    is_truthful: bool


class VoteResponse(BaseModel):
    id: str
    incident_id: str
    user_id: str
    is_truthful: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SOSSignal(BaseModel):
    lat: float
    lng: float


class SOSLogResponse(BaseModel):
    id: str
    user_id: str
    lat: float
    lng: float
    timestamp: datetime

    class Config:
        from_attributes = True

