from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class AvailabilitySlot(BaseModel):
    day: str  # Monday, Tuesday, etc.
    start_time: str  # "09:00"
    end_time: str   # "17:00"
    is_available: bool = True


class DoctorModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: Optional[str] = None
    name: str
    email: str
    specialization: str
    subspecialty: Optional[str] = None
    experience_years: int
    qualification: str
    hospital: str
    location: str
    bio: Optional[str] = None
    consultation_fee: float
    rating: float = 4.5
    total_reviews: int = 0
    profile_image: str = ""
    availability: List[AvailabilitySlot] = []
    languages: List[str] = ["English"]
    is_verified: bool = False
    is_active: bool = True
    is_static: bool = False  # True for pre-seeded doctors
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
