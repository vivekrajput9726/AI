from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from app.middleware.auth_middleware import get_current_user, require_patient
from app.services.appointment_service import (
    create_appointment, get_patient_appointments,
    update_appointment_status, add_prescription
)
from app.schemas.appointment_schema import AppointmentCreateRequest, AppointmentUpdateRequest


class RatingRequest(BaseModel):
    rating: int
    review: Optional[str] = None

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


@router.post("/{appointment_id}/rate", summary="Rate a completed appointment")
async def rate_appointment(
    appointment_id: str,
    data: RatingRequest,
    current_user: dict = Depends(require_patient)
):
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be between 1 and 5")
    from app.database.connection import get_db
    from app.utils.helpers import serialize_doc, str_to_objectid
    from datetime import datetime
    db = get_db()
    apt = await db.appointments.find_one({"_id": str_to_objectid(appointment_id)})
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if apt["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if apt.get("status") != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only rate completed appointments")
    if apt.get("rating"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already rated")

    # Save rating on appointment
    await db.appointments.update_one(
        {"_id": str_to_objectid(appointment_id)},
        {"$set": {"rating": data.rating, "review": data.review, "updated_at": datetime.utcnow()}}
    )

    # Recalculate doctor's average rating
    doctor = await db.doctors.find_one({"_id": str_to_objectid(apt["doctor_id"])})
    if doctor:
        all_ratings = await db.appointments.find(
            {"doctor_id": apt["doctor_id"], "rating": {"$exists": True}}
        ).to_list(length=None)
        ratings = [r["rating"] for r in all_ratings if r.get("rating")]
        if ratings:
            new_avg = round(sum(ratings) / len(ratings), 1)
            await db.doctors.update_one(
                {"_id": str_to_objectid(apt["doctor_id"])},
                {"$set": {"rating": new_avg, "total_reviews": len(ratings)}}
            )
    return {"message": "Rating submitted successfully"}


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
