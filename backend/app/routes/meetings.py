import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth_middleware import get_current_user, require_doctor
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid

router = APIRouter()


class InstantMeetingRequest(BaseModel):
    patient_id: str
    patient_name: str


def _make_jitsi_link() -> str:
    room = f"AIHealthcare-instant-{uuid.uuid4().hex[:10]}"
    return f"https://meet.jit.si/{room}"


@router.post("/instant", summary="Doctor starts an instant meeting with a patient")
async def start_instant_meeting(data: InstantMeetingRequest, current_user: dict = Depends(require_doctor)):
    db = get_db()

    # End any previous pending meeting this doctor has with this patient
    await db.instant_meetings.update_many(
        {"doctor_id": current_user["id"], "patient_id": data.patient_id, "status": {"$in": ["pending", "active"]}},
        {"$set": {"status": "ended", "ended_at": datetime.utcnow()}}
    )

    meeting_link = _make_jitsi_link()
    doc = {
        "doctor_id": current_user["id"],
        "doctor_name": current_user.get("full_name", "Doctor"),
        "patient_id": data.patient_id,
        "patient_name": data.patient_name,
        "meeting_link": meeting_link,
        "status": "pending",   # pending → active → ended
        "created_at": datetime.utcnow(),
        "ended_at": None,
    }
    result = await db.instant_meetings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/active", summary="Get the active/pending instant meeting for the current user")
async def get_active_meeting(current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = current_user["id"]
    role = current_user["role"]

    if role == "doctor":
        meeting = await db.instant_meetings.find_one(
            {"doctor_id": uid, "status": {"$in": ["pending", "active"]}},
            sort=[("created_at", -1)]
        )
    else:
        meeting = await db.instant_meetings.find_one(
            {"patient_id": uid, "status": {"$in": ["pending", "active"]}},
            sort=[("created_at", -1)]
        )

    if not meeting:
        return None
    return serialize_doc(meeting)


@router.patch("/{meeting_id}/end", summary="End an instant meeting")
async def end_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    meeting = await db.instant_meetings.find_one({"_id": str_to_objectid(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    uid = current_user["id"]
    if meeting["doctor_id"] != uid and meeting["patient_id"] != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.instant_meetings.find_one_and_update(
        {"_id": str_to_objectid(meeting_id)},
        {"$set": {"status": "ended", "ended_at": datetime.utcnow()}},
        return_document=True
    )
    return serialize_doc(result)


@router.get("/my-history", summary="Get all instant meetings for the current user")
async def get_meeting_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = current_user["id"]
    role = current_user["role"]
    query = {"doctor_id": uid} if role == "doctor" else {"patient_id": uid}
    cursor = db.instant_meetings.find(query).sort("created_at", -1).limit(20)
    return [serialize_doc(m) async for m in cursor]
