from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, paginate_query, str_to_objectid


async def get_all_doctors(
    page: int = 1,
    limit: int = 12,
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None
) -> dict:
    db = get_db()
    query = {"is_active": True}

    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"specialization": {"$regex": search, "$options": "i"}},
            {"hospital": {"$regex": search, "$options": "i"}}
        ]
    if min_rating:
        query["rating"] = {"$gte": min_rating}

    skip, lim = paginate_query(page, limit)
    total = await db.doctors.count_documents(query)
    cursor = db.doctors.find(query).sort("rating", -1).skip(skip).limit(lim)
    doctors = [serialize_doc(doc) async for doc in cursor]

    return {"doctors": doctors, "total": total, "page": page, "limit": lim}


async def get_doctor_by_id(doctor_id: str) -> dict:
    db = get_db()
    try:
        doctor = await db.doctors.find_one({"_id": str_to_objectid(doctor_id)})
    except Exception:
        doctor = await db.doctors.find_one({"user_id": doctor_id})

    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return serialize_doc(doctor)


async def get_doctors_by_specialization(specialization: str) -> list:
    db = get_db()
    cursor = db.doctors.find({
        "specialization": {"$regex": specialization, "$options": "i"},
        "is_active": True
    }).sort("rating", -1).limit(5)
    return [serialize_doc(doc) async for doc in cursor]


async def update_doctor_profile(user_id: str, update_data: dict) -> dict:
    db = get_db()
    update_data["updated_at"] = datetime.utcnow()
    result = await db.doctors.find_one_and_update(
        {"user_id": user_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    return serialize_doc(result)


async def get_doctor_appointments(doctor_id: str, status_filter: Optional[str] = None) -> list:
    db = get_db()
    doctor = await db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    query = {"doctor_id": str(doctor["_id"])}
    if status_filter:
        query["status"] = status_filter

    cursor = db.appointments.find(query).sort("appointment_date", -1)
    return [serialize_doc(doc) async for doc in cursor]
