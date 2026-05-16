from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"
    phone: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ["patient", "doctor"]:
            raise ValueError("Role must be patient or doctor")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
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


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
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
    is_active: bool
    is_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str
