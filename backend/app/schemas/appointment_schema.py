from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentCreateRequest(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_time: str
    appointment_type: str = "video"
    symptoms: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    patient_name: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    status: str
    appointment_type: str
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None
    consultation_fee: float
    video_session_id: Optional[str] = None
    created_at: datetime
