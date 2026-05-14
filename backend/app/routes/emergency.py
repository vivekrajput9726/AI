from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import get_current_user, require_patient
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.utils.sms_utils import send_sms
from app.utils.email_utils import send_email
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str


class SOSRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    message: Optional[str] = "I need emergency help!"


@router.get("/contacts", summary="Get emergency contacts")
async def get_contacts(current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.emergency_contacts.find_one({"patient_id": current_user["id"]})
    return doc.get("contacts", []) if doc else []


@router.post("/contacts", summary="Save emergency contacts")
async def save_contacts(contacts: List[EmergencyContact], current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.emergency_contacts.update_one(
        {"patient_id": current_user["id"]},
        {"$set": {"patient_id": current_user["id"], "contacts": [c.dict() for c in contacts], "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Contacts saved"}


@router.post("/sos", summary="Trigger SOS alert")
async def trigger_sos(data: SOSRequest, current_user: dict = Depends(require_patient)):
    db = get_db()
    doc = await db.emergency_contacts.find_one({"patient_id": current_user["id"]})
    contacts = doc.get("contacts", []) if doc else []

    location_text = ""
    if data.latitude and data.longitude:
        location_text = f"\n📍 Location: https://maps.google.com/?q={data.latitude},{data.longitude}"
    elif data.address:
        location_text = f"\n📍 Address: {data.address}"

    msg = f"🚨 EMERGENCY ALERT!\n{current_user['full_name']} needs help!\n{data.message}{location_text}\n\nPlease contact them immediately or call emergency services."

    sent = 0
    for contact in contacts:
        if contact.get("phone"):
            send_sms(to_phone=contact["phone"], message=msg)
            sent += 1

    # Log SOS event
    await db.sos_events.insert_one({
        "patient_id": current_user["id"],
        "patient_name": current_user["full_name"],
        "latitude": data.latitude,
        "longitude": data.longitude,
        "address": data.address,
        "contacts_notified": sent,
        "created_at": datetime.utcnow()
    })

    return {"message": f"SOS sent to {sent} contact(s)", "contacts_notified": sent}
