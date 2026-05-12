from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.schemas.appointment_schema import AppointmentCreateRequest
from app.utils.email_utils import send_appointment_booked_email, send_appointment_confirmed_email, send_appointment_cancelled_email


async def create_appointment(patient: dict, data: AppointmentCreateRequest) -> dict:
    db = get_db()
    doctor = await db.doctors.find_one({"_id": str_to_objectid(data.doctor_id)})
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    appointment_doc = {
        "patient_id": patient["id"],
        "doctor_id": data.doctor_id,
        "patient_name": patient["full_name"],
        "doctor_name": doctor["name"],
        "appointment_date": data.appointment_date,
        "appointment_time": data.appointment_time,
        "status": "pending",
        "appointment_type": data.appointment_type,
        "symptoms": data.symptoms,
        "notes": data.notes,
        "prescription": None,
        "consultation_fee": doctor.get("consultation_fee", 500),
        "video_session_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.appointments.insert_one(appointment_doc)
    appointment_doc["_id"] = result.inserted_id

    # Send email notification
    send_appointment_booked_email(
        patient_email=patient.get("email", ""),
        patient_name=patient["full_name"],
        doctor_name=doctor["name"],
        date=data.appointment_date,
        time=data.appointment_time
    )

    return serialize_doc(appointment_doc)


async def get_patient_appointments(patient_id: str, status_filter: Optional[str] = None) -> list:
    db = get_db()
    query = {"patient_id": patient_id}
    if status_filter:
        query["status"] = status_filter
    cursor = db.appointments.find(query).sort("appointment_date", -1)
    return [serialize_doc(doc) async for doc in cursor]


async def update_appointment_status(appointment_id: str, new_status: str, actor: dict) -> dict:
    db = get_db()
    appointment = await db.appointments.find_one({"_id": str_to_objectid(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if actor["role"] == "patient" and appointment["patient_id"] != actor["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    valid_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["completed", "cancelled"],
        "cancelled": [],
        "completed": []
    }
    current = appointment.get("status", "pending")
    if new_status not in valid_transitions.get(current, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {current} to {new_status}"
        )

    result = await db.appointments.find_one_and_update(
        {"_id": str_to_objectid(appointment_id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
        return_document=True
    )

    # Send email based on new status
    patient = await db.users.find_one({"_id": str_to_objectid(appointment["patient_id"])})
    if patient:
        if new_status == "confirmed":
            send_appointment_confirmed_email(
                patient_email=patient.get("email", ""),
                patient_name=appointment.get("patient_name", ""),
                doctor_name=appointment.get("doctor_name", ""),
                date=appointment.get("appointment_date", ""),
                time=appointment.get("appointment_time", "")
            )
        elif new_status == "cancelled":
            send_appointment_cancelled_email(
                patient_email=patient.get("email", ""),
                patient_name=appointment.get("patient_name", ""),
                doctor_name=appointment.get("doctor_name", ""),
                date=appointment.get("appointment_date", "")
            )

    return serialize_doc(result)


async def add_prescription(appointment_id: str, prescription: str, doctor_user_id: str) -> dict:
    db = get_db()
    appointment = await db.appointments.find_one({"_id": str_to_objectid(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    result = await db.appointments.find_one_and_update(
        {"_id": str_to_objectid(appointment_id)},
        {"$set": {"prescription": prescription, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    return serialize_doc(result)
