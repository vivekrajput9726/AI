from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.middleware.auth_middleware import get_current_user, require_doctor
from app.services.doctor_service import (
    get_all_doctors, get_doctor_by_id, update_doctor_profile, get_doctor_appointments
)
from app.schemas.doctor_schema import DoctorUpdateRequest

router = APIRouter()


@router.get("/my-patients", summary="Doctor gets list of all their unique patients with history")
async def get_my_patients(current_user: dict = Depends(require_doctor)):
    from app.database.connection import get_db
    from app.utils.helpers import serialize_doc, str_to_objectid

    db = get_db()

    # Find the doctor profile to get their _id
    doctor = await db.doctors.find_one({"user_id": current_user["id"]})
    if not doctor:
        return []

    doctor_id_str = str(doctor["_id"])

    # Get all appointments for this doctor
    cursor = db.appointments.find({"doctor_id": doctor_id_str}).sort("appointment_date", -1)
    appointments = [serialize_doc(a) async for a in cursor]

    # Group by patient_id
    patients_map = {}
    for apt in appointments:
        pid = apt["patient_id"]
        if pid not in patients_map:
            patients_map[pid] = {"appointments": [], "patient_info": None}
        patients_map[pid]["appointments"].append(apt)

    # Fetch user info for each unique patient
    result = []
    for pid, data in patients_map.items():
        try:
            user = await db.users.find_one({"_id": str_to_objectid(pid)})
        except Exception:
            user = None

        patient_info = serialize_doc(user) if user else {"id": pid, "full_name": data["appointments"][0].get("patient_name", "Unknown"), "email": "", "phone": "", "gender": "", "date_of_birth": ""}

        # Remove sensitive data
        patient_info.pop("password_hash", None)

        apts = data["appointments"]
        last_apt = apts[0] if apts else {}

        result.append({
            "patient": patient_info,
            "total_appointments": len(apts),
            "last_appointment": last_apt,
            "appointments": apts,
            "has_confirmed": any(a["status"] == "confirmed" for a in apts),
        })

    # Sort by last appointment date
    result.sort(key=lambda x: x["last_appointment"].get("appointment_date", ""), reverse=True)
    return result


@router.get("/", summary="List all doctors with filters")
async def list_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_fee: Optional[float] = None
):
    return await get_all_doctors(page, limit, specialization, search, min_rating, max_fee)


@router.get("/specializations", summary="Get list of available specializations")
async def get_specializations():
    from app.database.connection import get_db
    db = get_db()
    specs = await db.doctors.distinct("specialization", {"is_active": True})
    return {"specializations": sorted(specs)}


@router.get("/profile/me", summary="Doctor gets own full profile")
async def get_my_profile(current_user: dict = Depends(require_doctor)):
    from app.database.connection import get_db
    from app.utils.helpers import serialize_doc
    db = get_db()
    doctor = await db.doctors.find_one({"user_id": current_user["id"]})
    if not doctor:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    return serialize_doc(doctor)


@router.put("/profile/update", summary="Doctor updates own profile")
async def update_profile(
    data: DoctorUpdateRequest,
    current_user: dict = Depends(require_doctor)
):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    return await update_doctor_profile(current_user["id"], update)


@router.get("/profile/appointments", summary="Doctor views own appointments")
async def doctor_appointments(
    status: Optional[str] = None,
    current_user: dict = Depends(require_doctor)
):
    return await get_doctor_appointments(current_user["id"], status)


@router.get("/{doctor_id}", summary="Get doctor by ID")
async def get_doctor(doctor_id: str):
    return await get_doctor_by_id(doctor_id)
