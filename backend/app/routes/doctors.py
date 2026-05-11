from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.middleware.auth_middleware import get_current_user, require_doctor
from app.services.doctor_service import (
    get_all_doctors, get_doctor_by_id, update_doctor_profile, get_doctor_appointments
)
from app.schemas.doctor_schema import DoctorUpdateRequest

router = APIRouter()


@router.get("/", summary="List all doctors with filters")
async def list_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None
):
    return await get_all_doctors(page, limit, specialization, search, min_rating)


@router.get("/specializations", summary="Get list of available specializations")
async def get_specializations():
    from app.database.connection import get_db
    db = get_db()
    specs = await db.doctors.distinct("specialization", {"is_active": True})
    return {"specializations": sorted(specs)}


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
