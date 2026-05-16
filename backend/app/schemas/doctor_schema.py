from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AvailabilitySlotSchema(BaseModel):
    day: str
    slots: List[str]  # e.g. ["09:00", "10:00", "14:00"]


class DoctorResponse(BaseModel):
    id: str
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
    rating: float
    total_reviews: int
    profile_image: str
    availability: List[AvailabilitySlotSchema] = []
    languages: List[str] = []
    is_verified: bool
    is_active: bool


class DoctorUpdateRequest(BaseModel):
    specialization: Optional[str] = None
    subspecialty: Optional[str] = None
    experience_years: Optional[int] = None
    qualification: Optional[str] = None
    hospital: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    profile_image: Optional[str] = None
    availability: Optional[List[AvailabilitySlotSchema]] = None
    languages: Optional[List[str]] = None


class DoctorListResponse(BaseModel):
    doctors: List[DoctorResponse]
    total: int
    page: int
    limit: int
