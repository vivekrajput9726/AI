from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth_middleware import require_admin
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid, paginate_query
from datetime import datetime, timedelta
from collections import defaultdict

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


@router.get("/appointments", summary="List all appointments for admin")
async def list_all_appointments(page: int = 1, limit: int = 50, status: str = None, current_user: dict = Depends(require_admin)):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    skip, lim = paginate_query(page, limit)
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("created_at", -1).skip(skip).limit(lim)
    apts = [serialize_doc(a) async for a in cursor]
    return {"appointments": apts, "total": total}

@router.patch("/appointments/{apt_id}/status", summary="Admin update appointment status")
async def admin_update_appointment(apt_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    apt = await db.appointments.find_one({"_id": str_to_objectid(apt_id)})
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    new_status = "cancelled" if apt.get("status") != "cancelled" else "confirmed"
    result = await db.appointments.find_one_and_update(
        {"_id": str_to_objectid(apt_id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    return serialize_doc(result)

@router.delete("/users/{user_id}", summary="Delete user")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    result = await db.users.delete_one({"_id": str_to_objectid(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@router.delete("/doctors/{doctor_id}", summary="Delete doctor")
async def delete_doctor(doctor_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    result = await db.doctors.delete_one({"_id": str_to_objectid(doctor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor deleted"}

@router.get("/doctors", summary="List all doctors for admin")
async def list_doctors(page: int = 1, limit: int = 20, current_user: dict = Depends(require_admin)):
    db = get_db()
    skip, lim = paginate_query(page, limit)
    total = await db.doctors.count_documents({})
    cursor = db.doctors.find({}).sort("created_at", -1).skip(skip).limit(lim)
    doctors = [serialize_doc(doc) async for doc in cursor]
    return {"doctors": doctors, "total": total, "page": page, "limit": lim}


@router.get("/analytics", summary="Admin analytics data")
async def get_analytics(current_user: dict = Depends(require_admin)):
    db = get_db()

    # Monthly appointment trends (last 6 months)
    monthly = defaultdict(lambda: {"total": 0, "completed": 0, "cancelled": 0, "revenue": 0})
    now = datetime.utcnow()
    six_months_ago = now - timedelta(days=180)
    async for apt in db.appointments.find({"created_at": {"$gte": six_months_ago}}):
        month_key = apt["created_at"].strftime("%b %Y") if isinstance(apt.get("created_at"), datetime) else "Unknown"
        monthly[month_key]["total"] += 1
        if apt.get("status") == "completed":
            monthly[month_key]["completed"] += 1
            monthly[month_key]["revenue"] += apt.get("consultation_fee", 0)
        elif apt.get("status") == "cancelled":
            monthly[month_key]["cancelled"] += 1

    # Build ordered months list
    months_ordered = []
    for i in range(5, -1, -1):
        m = (now - timedelta(days=30 * i)).strftime("%b %Y")
        months_ordered.append({"month": m, **monthly[m]})

    # Appointment type distribution
    type_counts = defaultdict(int)
    async for apt in db.appointments.find({}):
        atype = apt.get("appointment_type", "video")
        type_counts[atype] += 1

    type_data = [{"name": k.replace("-", " ").title(), "value": v} for k, v in type_counts.items()]

    # Total revenue
    total_revenue = 0
    async for apt in db.appointments.find({"status": "completed"}):
        total_revenue += apt.get("consultation_fee", 0)

    # Weekly appointments (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.appointments.count_documents({"created_at": {"$gte": day_start, "$lt": day_end}})
        weekly.append({"day": day.strftime("%a"), "appointments": count})

    # Top 5 specializations by appointment count
    spec_counts = defaultdict(int)
    async for apt in db.appointments.find({}):
        doc = await db.doctors.find_one({"_id": str_to_objectid(apt["doctor_id"])}) if apt.get("doctor_id") else None
        if doc:
            spec_counts[doc.get("specialization", "Other")] += 1
    top_specs = sorted([{"name": k, "appointments": v} for k, v in spec_counts.items()], key=lambda x: -x["appointments"])[:5]

    # New patients this month
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_patients_month = await db.users.count_documents({"role": "patient", "created_at": {"$gte": month_start}})
    new_doctors_month = await db.doctors.count_documents({"created_at": {"$gte": month_start}})

    return {
        "monthly_trends": months_ordered,
        "appointment_types": type_data,
        "weekly_appointments": weekly,
        "top_specializations": top_specs,
        "total_revenue": total_revenue,
        "new_patients_this_month": new_patients_month,
        "new_doctors_this_month": new_doctors_month,
    }


from pydantic import BaseModel
from typing import Optional

class VerifyDoctorBody(BaseModel):
    is_verified: bool = True

@router.patch("/doctors/{doctor_id}/verify", summary="Verify or reject a doctor")
async def verify_doctor(doctor_id: str, body: VerifyDoctorBody = VerifyDoctorBody(), current_user: dict = Depends(require_admin)):
    db = get_db()
    result = await db.doctors.find_one_and_update(
        {"_id": str_to_objectid(doctor_id)},
        {"$set": {"is_verified": body.is_verified, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return serialize_doc(result)
