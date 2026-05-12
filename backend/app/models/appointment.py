from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class AppointmentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    patient_id: str
    doctor_id: str
    patient_name: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    status: str = "pending"  # pending | confirmed | cancelled | completed
    appointment_type: str = "video"  # video | in-person
    symptoms: Optional[str] = None
    ai_analysis: Optional[dict] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None
    consultation_fee: float = 0
    video_session_id: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
