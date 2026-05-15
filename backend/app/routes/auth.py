from fastapi import APIRouter, HTTPException
from app.schemas.user_schema import UserRegisterRequest, UserLoginRequest, RefreshTokenRequest
from app.services.auth_service import register_user, login_user, refresh_access_token
from app.database.connection import get_db
from app.utils.sms_utils import send_sms
from app.utils.jwt_utils import create_access_token, create_refresh_token
from app.utils.helpers import serialize_doc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import random

router = APIRouter()


class OTPSendRequest(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = ""
    password: str
    role: str = "patient"

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str


@router.post("/send-otp", summary="Register + send OTP")
async def send_otp(data: OTPSendRequest):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing and existing.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already registered")

    otp_code = str(random.randint(100000, 999999))
    expiry   = datetime.utcnow() + timedelta(minutes=10)

    # Save OTP record
    await db.otp_records.update_one(
        {"email": data.email},
        {"$set": {
            "email":     data.email,
            "otp":       otp_code,
            "expires_at": expiry,
            "full_name": data.full_name,
            "phone":     data.phone,
            "password":  data.password,
            "role":      data.role,
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )

    # Try sending SMS; show OTP in response for demo mode
    sent = False
    if data.phone:
        sent = send_sms(
            to_phone=data.phone,
            message=f"Your Synora Health OTP is: {otp_code}. Valid for 10 minutes."
        )

    return {
        "message": "OTP sent successfully",
        "otp_sent_via": "sms" if sent else "demo",
        # Show OTP in demo mode when SMS not configured
        "demo_otp": otp_code if not sent else None
    }


@router.post("/verify-otp", summary="Verify OTP and complete registration")
async def verify_otp(data: OTPVerifyRequest):
    db = get_db()
    record = await db.otp_records.find_one({"email": data.email})

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found for this email. Please register again.")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired. Please register again.")

    # Complete registration via existing service
    from app.schemas.user_schema import UserRegisterRequest
    reg_data = UserRegisterRequest(
        full_name=record["full_name"],
        email=record["email"],
        password=record["password"],
        phone=record.get("phone",""),
        role=record["role"]
    )
    result = await register_user(reg_data)

    # Mark as verified
    await db.users.update_one({"email": data.email}, {"$set": {"is_verified": True}})

    # Clean up OTP
    await db.otp_records.delete_one({"email": data.email})

    return result


@router.post("/register", summary="Register a new user")
async def register(data: UserRegisterRequest):
    return await register_user(data)


@router.post("/login", summary="Login user")
async def login(data: UserLoginRequest):
    return await login_user(data)


@router.post("/refresh", summary="Refresh access token")
async def refresh(data: RefreshTokenRequest):
    return await refresh_access_token(data.refresh_token)
