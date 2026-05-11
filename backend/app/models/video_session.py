from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class VideoSessionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    appointment_id: str
    patient_id: str
    doctor_id: str
    room_name: str
    room_url: Optional[str] = None
    status: str = "waiting"  # waiting | active | ended
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
