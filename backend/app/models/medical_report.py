from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class MedicalReportModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    symptoms: str
    ai_analysis: Optional[dict] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
