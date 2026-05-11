from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.middleware.auth_middleware import get_current_user, require_patient
from app.services.appointment_service import (
    create_appointment, get_patient_appointments,
    update_appointment_status, add_prescription
)
from app.schemas.appointment_schema import AppointmentCreateRequest, AppointmentUpdateRequest

router = APIRouter()


@router.post("/", summary="Book an appointment")
async def book_appointment(
    data: AppointmentCreateRequest,
    current_user: dict = Depends(require_patient)
):
    return await create_appointment(current_user, data)


@router.get("/my", summary="Get current user's appointments")
async def my_appointments(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "patient":
        return await get_patient_appointments(current_user["id"], status)
    else:
        from app.services.doctor_service import get_doctor_appointments
        return await get_doctor_appointments(current_user["id"], status)


@router.patch("/{appointment_id}/status", summary="Update appointment status")
async def update_status(
    appointment_id: str,
    data: AppointmentUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    if data.prescription:
        return await add_prescription(appointment_id, data.prescription, current_user["id"])
    return await update_appointment_status(appointment_id, data.status, current_user)


@router.get("/{appointment_id}", summary="Get appointment by ID")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    from app.database.connection import get_db
    from app.utils.helpers import serialize_doc, str_to_objectid
    db = get_db()
    apt = await db.appointments.find_one({"_id": str_to_objectid(appointment_id)})
    if not apt:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return serialize_doc(apt)
