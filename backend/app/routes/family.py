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
