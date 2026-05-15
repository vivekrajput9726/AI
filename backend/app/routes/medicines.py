from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import require_patient
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class MedicineIn(BaseModel):
    name: str
    dosage: str
    frequency: str = "Once daily"
    time: str = "08:00"
    meal: str = "After meal"
    notes: Optional[str] = ""
    active: bool = True

class TakenLog(BaseModel):
    medicine_id: str
    status: str   # "taken" | "missed"
    note: Optional[str] = ""

@router.get("/", summary="Get my medicines")
async def get_medicines(current_user: dict = Depends(require_patient)):
    db = get_db()
    cursor = db.medicines.find({"patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(m) async for m in cursor]

@router.post("/", summary="Add medicine reminder")
async def add_medicine(data: MedicineIn, current_user: dict = Depends(require_patient)):
    db = get_db()
    doc = {
        **data.dict(),
        "patient_id": current_user["id"],
        "taken_count": 0,
        "missed_count": 0,
        "logs": [],
        "created_at": datetime.utcnow()
    }
    result = await db.medicines.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.put("/{med_id}", summary="Update medicine")
async def update_medicine(med_id: str, data: MedicineIn, current_user: dict = Depends(require_patient)):
    db = get_db()
    await db.medicines.update_one(
        {"_id": str_to_objectid(med_id), "patient_id": current_user["id"]},
        {"$set": {**data.dict(), "updated_at": datetime.utcnow()}}
    )
    return {"message": "Updated"}

@router.delete("/{med_id}", summary="Delete medicine")
async def delete_medicine(med_id: str, current_user: dict = Depends(require_patient)):
    db = get_db()
    await db.medicines.delete_one({"_id": str_to_objectid(med_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}

@router.post("/log", summary="Log taken or missed")
async def log_dose(data: TakenLog, current_user: dict = Depends(require_patient)):
    db = get_db()
    log_entry = {"status": data.status, "note": data.note, "logged_at": datetime.utcnow().isoformat()}
    inc_field = "taken_count" if data.status == "taken" else "missed_count"
    await db.medicines.update_one(
        {"_id": str_to_objectid(data.medicine_id), "patient_id": current_user["id"]},
        {"$inc": {inc_field: 1}, "$push": {"logs": log_entry}}
    )
    return {"message": f"Marked as {data.status}"}

@router.get("/adherence", summary="Get adherence summary")
async def get_adherence(current_user: dict = Depends(require_patient)):
    db = get_db()
    cursor = db.medicines.find({"patient_id": current_user["id"], "active": True})
    meds = [serialize_doc(m) async for m in cursor]
    total_taken  = sum(m.get("taken_count", 0) for m in meds)
    total_missed = sum(m.get("missed_count", 0) for m in meds)
    total = total_taken + total_missed
    pct = round((total_taken / total) * 100) if total > 0 else 100
    return {"adherence_pct": pct, "taken": total_taken, "missed": total_missed, "active_medicines": len(meds)}
