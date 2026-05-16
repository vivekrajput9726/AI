from fastapi import APIRouter, HTTPException
from app.schemas.user_schema import UserLoginRequest, RefreshTokenRequest
from app.services.auth_service import login_user, refresh_access_token
from app.database.connection import get_db
from app.utils.email_utils import send_otp_email
from app.utils.sms_utils import send_sms
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

    # ── Format phone to E.164 for Twilio (+91XXXXXXXXXX) ─────────────────
    phone = data.phone.strip() if data.phone else ""
    if phone and not phone.startswith("+"):
        # Auto-prefix India code if user typed 10-digit number
        digits = phone.replace(" ", "").replace("-", "")
        phone = f"+91{digits}" if len(digits) == 10 else f"+{digits}"

    # ── Send OTP via SMS if phone provided, else via email ─────────────────
    sms_sent   = False
    email_sent = False

    if phone:
        sms_message = (
            f"Your Synora Health OTP is: {otp_code}\n"
            f"Valid for 10 minutes. Do not share with anyone."
        )
        sms_sent = send_sms(to_phone=phone, message=sms_message)

    if not sms_sent:
        email_sent = send_otp_email(
            to_email=data.email,
            otp_code=otp_code,
            full_name=data.full_name
        )

    real_delivery = sms_sent or email_sent
    channel       = "sms" if sms_sent else ("email" if email_sent else "demo")

    return {
        "message":    "OTP sent successfully",
        "otp_sent_via": channel,
        "phone_hint": f"****{phone[-4:]}" if sms_sent else None,
        # Only returned in demo mode (no SMS or email configured)
        "demo_otp":   otp_code if not real_delivery else None,
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
    from app.services.auth_service import register_user, login_user
    from app.schemas.user_schema import UserLoginRequest
    from app.utils.password_utils import hash_password

    # Check if user already exists but is not verified (retry case)
    existing_user = await db.users.find_one({"email": data.email})

    if existing_user and not existing_user.get("is_verified"):
        # Update existing unverified user and mark as verified
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {
                "full_name":     record["full_name"],
                "password_hash": hash_password(record["password"]),
                "phone":         record.get("phone", ""),
                "role":          record["role"],
                "is_verified":   True,
                "updated_at":    datetime.utcnow(),
            }}
        )
        await db.otp_records.delete_one({"email": data.email})
        # Login and return tokens
        result = await login_user(UserLoginRequest(email=data.email, password=record["password"]))
        return result

    # New user — register fresh
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
