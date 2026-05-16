from fastapi import APIRouter, HTTPException
from app.schemas.user_schema import UserLoginRequest, RefreshTokenRequest
from app.services.auth_service import login_user, refresh_access_token
from app.database.connection import get_db
from app.utils.email_utils import send_otp_email
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import random

router = APIRouter()


class OTPSendRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str
    role: str = "patient"


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


@router.post("/send-otp", summary="Register + send OTP to email")
async def send_otp(data: OTPSendRequest):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing and existing.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already registered")

    otp_code = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)

    await db.otp_records.update_one(
        {"email": data.email},
        {"$set": {
            "email":      data.email,
            "otp":        otp_code,
            "expires_at": expiry,
            "full_name":  data.full_name,
            "phone":      data.phone,
            "password":   data.password,
            "role":       data.role,
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )

    email_sent = send_otp_email(
        to_email=data.email,
        otp_code=otp_code,
        full_name=data.full_name
    )

    return {
        "message": "OTP sent successfully",
        "otp_sent_via": "email" if email_sent else "demo",
        # Returned only in demo/dev mode when SMTP is not configured
        "demo_otp": otp_code if not email_sent else None
    }


@router.post("/verify-otp", summary="Verify email OTP and complete registration")
async def verify_otp(data: OTPVerifyRequest):
    db = get_db()
    record = await db.otp_records.find_one({"email": data.email})

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found for this email. Please register again.")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    from app.schemas.user_schema import UserRegisterRequest
    from app.services.auth_service import register_user

    reg_data = UserRegisterRequest(
        full_name=record["full_name"],
        email=record["email"],
        password=record["password"],
        phone=record.get("phone", ""),
        role=record["role"]
    )
    result = await register_user(reg_data)

    await db.users.update_one({"email": data.email}, {"$set": {"is_verified": True}})
    await db.otp_records.delete_one({"email": data.email})

    return result


@router.post("/login", summary="Login user")
async def login(data: UserLoginRequest):
    return await login_user(data)


@router.post("/refresh", summary="Refresh access token")
async def refresh(data: RefreshTokenRequest):
    return await refresh_access_token(data.refresh_token)
