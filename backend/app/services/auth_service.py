from datetime import datetime
from fastapi import HTTPException, status
from app.database.connection import get_db
from app.utils.password_utils import hash_password, verify_password
from app.utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from app.utils.helpers import serialize_doc, str_to_objectid
from app.schemas.user_schema import UserRegisterRequest, UserLoginRequest


async def register_user(data: UserRegisterRequest) -> dict:
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_doc = {
        "full_name": data.full_name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "phone": data.phone,
        "date_of_birth": None,
        "gender": None,
        "address": None,
        "profile_image": None,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    if data.role == "doctor":
        # Link to existing seeded doctor profile if email matches, otherwise create new
        existing_doctor = await db.doctors.find_one({"email": data.email})
        if existing_doctor:
            await db.doctors.update_one(
                {"_id": existing_doctor["_id"]},
                {"$set": {"user_id": str(result.inserted_id), "updated_at": datetime.utcnow()}}
            )
        else:
            doctor_doc = {
                "user_id": str(result.inserted_id),
                "name": data.full_name,
                "email": data.email,
                "specialization": "General Physician",
                "experience_years": 0,
                "qualification": "",
                "hospital": "",
                "location": "",
                "consultation_fee": 500,
                "rating": 0.0,
                "total_reviews": 0,
                "profile_image": "",
                "availability": [],
                "languages": ["English"],
                "is_verified": False,
                "is_active": True,
                "is_static": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.doctors.insert_one(doctor_doc)

    serialized = serialize_doc(user_doc)
    access_token = create_access_token({"sub": serialized["id"], "role": data.role})
    refresh_token = create_refresh_token({"sub": serialized["id"], "role": data.role})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialized
    }


async def login_user(data: UserLoginRequest) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.get("is_active"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    serialized = serialize_doc(user)
    access_token = create_access_token({"sub": serialized["id"], "role": serialized["role"]})
    refresh_token = create_refresh_token({"sub": serialized["id"], "role": serialized["role"]})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialized
    }


async def refresh_access_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    role = payload.get("role")
    db = get_db()
    user = await db.users.find_one({"_id": str_to_objectid(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token({"sub": user_id, "role": role})
    new_refresh = create_refresh_token({"sub": user_id, "role": role})
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
