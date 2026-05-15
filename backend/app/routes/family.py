from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class FamilyMember(BaseModel):
    name: str
    relation: str
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    emergency_contact: Optional[str] = None


@router.get("/", summary="Get family members")
async def get_family(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.family_members.find({"owner_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(m) async for m in cursor]


@router.post("/", summary="Add family member")
async def add_member(data: FamilyMember, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {**data.dict(), "owner_id": current_user["id"], "created_at": datetime.utcnow()}
    result = await db.family_members.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/{member_id}", summary="Update family member")
async def update_member(member_id: str, data: FamilyMember, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.family_members.find_one_and_update(
        {"_id": str_to_objectid(member_id), "owner_id": current_user["id"]},
        {"$set": {**data.dict(), "updated_at": datetime.utcnow()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Member not found")
    return serialize_doc(result)


@router.delete("/{member_id}", summary="Delete family member")
async def delete_member(member_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.family_members.delete_one({"_id": str_to_objectid(member_id), "owner_id": current_user["id"]})
    return {"message": "Deleted"}


# ── Family Vitals ─────────────────────────────────────────────────────────────
class VitalsIn(BaseModel):
    bp: Optional[str] = ""
    heartRate: Optional[str] = ""
    temperature: Optional[str] = ""
    weight: Optional[str] = ""
    oxygen: Optional[str] = ""
    bloodSugar: Optional[str] = ""

@router.get("/{member_id}/vitals", summary="Get vitals for a family member")
async def get_vitals(member_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.family_vitals.find_one({"member_id": member_id, "owner_id": current_user["id"]})
    return doc.get("vitals", {}) if doc else {}

@router.put("/{member_id}/vitals", summary="Save vitals for a family member")
async def save_vitals(member_id: str, data: VitalsIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.family_vitals.update_one(
        {"member_id": member_id, "owner_id": current_user["id"]},
        {"$set": {"member_id": member_id, "owner_id": current_user["id"], "vitals": data.dict(), "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Vitals saved"}


# ── Family Medicines ──────────────────────────────────────────────────────────
class FamilyMedIn(BaseModel):
    name: str
    dosage: Optional[str] = ""
    frequency: str = "Morning"
    notes: Optional[str] = ""

@router.get("/{member_id}/medicines", summary="Get medicines for a family member")
async def get_family_medicines(member_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.family_medicines.find({"member_id": member_id, "owner_id": current_user["id"]})
    return [serialize_doc(m) async for m in cursor]

@router.post("/{member_id}/medicines", summary="Add medicine for a family member")
async def add_family_medicine(member_id: str, data: FamilyMedIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {**data.dict(), "member_id": member_id, "owner_id": current_user["id"], "taken_dates": [], "created_at": datetime.utcnow()}
    result = await db.family_medicines.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.patch("/{member_id}/medicines/{med_id}/toggle", summary="Toggle taken today")
async def toggle_taken(member_id: str, med_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from datetime import date
    today = str(date.today())
    med = await db.family_medicines.find_one({"_id": str_to_objectid(med_id), "owner_id": current_user["id"]})
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    taken_dates = med.get("taken_dates", [])
    if today in taken_dates:
        taken_dates.remove(today)
    else:
        taken_dates.append(today)
    await db.family_medicines.update_one({"_id": str_to_objectid(med_id)}, {"$set": {"taken_dates": taken_dates}})
    return {"taken_today": today in taken_dates}

@router.delete("/{member_id}/medicines/{med_id}", summary="Delete family medicine")
async def delete_family_medicine(member_id: str, med_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.family_medicines.delete_one({"_id": str_to_objectid(med_id), "owner_id": current_user["id"]})
    return {"message": "Deleted"}
