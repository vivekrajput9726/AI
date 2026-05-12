from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class HealthRecordCreate(BaseModel):
    title: str
    record_type: str  # prescription, lab_report, diagnosis, other
    description: Optional[str] = ""
    file_data: Optional[str] = ""  # base64 file
    doctor_name: Optional[str] = ""
    date: Optional[str] = ""


@router.post("/", summary="Add health record")
async def add_record(data: HealthRecordCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "patient_id": current_user["id"],
        "title": data.title,
        "record_type": data.record_type,
        "description": data.description,
        "file_data": data.file_data,
        "doctor_name": data.doctor_name,
        "date": data.date or datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow(),
    }
    result = await db.health_records.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/", summary="Get my health records")
async def get_records(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.health_records.find({"patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(r) async for r in cursor]


@router.delete("/{record_id}", summary="Delete health record")
async def delete_record(record_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from app.utils.helpers import str_to_objectid
    await db.health_records.delete_one({
        "_id": str_to_objectid(record_id),
        "patient_id": current_user["id"]
    })
    return {"success": True}
