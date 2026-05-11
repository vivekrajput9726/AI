from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth_middleware import require_admin
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid, paginate_query
from datetime import datetime

router = APIRouter()


@router.get("/stats", summary="Admin dashboard statistics")
async def get_stats(current_user: dict = Depends(require_admin)):
    db = get_db()
    total_users = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.doctors.count_documents({})
    total_appointments = await db.appointments.count_documents({})
    pending_appointments = await db.appointments.count_documents({"status": "pending"})
    verified_doctors = await db.doctors.count_documents({"is_verified": True})

    return {
        "total_patients": total_users,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "verified_doctors": verified_doctors,
        "unverified_doctors": total_doctors - verified_doctors
    }


@router.get("/users", summary="List all users")
async def list_users(page: int = 1, limit: int = 20, current_user: dict = Depends(require_admin)):
    db = get_db()
    skip, lim = paginate_query(page, limit)
    total = await db.users.count_documents({})
    cursor = db.users.find({}).sort("created_at", -1).skip(skip).limit(lim)
    users = [serialize_doc(doc) async for doc in cursor]
    return {"users": users, "total": total, "page": page, "limit": lim}


@router.patch("/users/{user_id}/toggle", summary="Activate/deactivate user")
async def toggle_user(user_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    user = await db.users.find_one({"_id": str_to_objectid(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    new_status = not user.get("is_active", True)
    result = await db.users.find_one_and_update(
        {"_id": str_to_objectid(user_id)},
        {"$set": {"is_active": new_status, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    return serialize_doc(result)


@router.get("/doctors", summary="List all doctors for admin")
async def list_doctors(page: int = 1, limit: int = 20, current_user: dict = Depends(require_admin)):
    db = get_db()
    skip, lim = paginate_query(page, limit)
    total = await db.doctors.count_documents({})
    cursor = db.doctors.find({}).sort("created_at", -1).skip(skip).limit(lim)
    doctors = [serialize_doc(doc) async for doc in cursor]
    return {"doctors": doctors, "total": total, "page": page, "limit": lim}


@router.patch("/doctors/{doctor_id}/verify", summary="Verify a doctor")
async def verify_doctor(doctor_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    result = await db.doctors.find_one_and_update(
        {"_id": str_to_objectid(doctor_id)},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return serialize_doc(result)
