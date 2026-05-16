from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    full_name: str
    email: EmailStr
    password_hash: str
    role: str = "patient"  # patient | doctor | admin
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    blood_sugar_mg_dl: Optional[float] = None
    heart_rate_bpm: Optional[int] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
