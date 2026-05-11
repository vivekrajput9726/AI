import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.config.settings import settings

router = APIRouter()


@router.post("/session/{appointment_id}", summary="Create video session for appointment")
async def create_video_session(appointment_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    appointment = await db.appointments.find_one({"_id": str_to_objectid(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if appointment.get("status") != "confirmed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment must be confirmed")

    existing = await db.video_sessions.find_one({"appointment_id": appointment_id})
    if existing:
        return serialize_doc(existing)

    room_name = f"aihealthcare-{appointment_id}-{uuid.uuid4().hex[:8]}"
    room_url = None

    if settings.DAILY_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.DAILY_API_URL}/rooms",
                    headers={"Authorization": f"Bearer {settings.DAILY_API_KEY}"},
                    json={"name": room_name, "privacy": "private", "properties": {"enable_chat": True}}
                )
                if resp.status_code == 200:
                    room_url = resp.json().get("url")
        except Exception:
            pass

    session_doc = {
        "appointment_id": appointment_id,
        "patient_id": appointment["patient_id"],
        "doctor_id": appointment["doctor_id"],
        "room_name": room_name,
        "room_url": room_url,
        "status": "waiting",
        "started_at": None,
        "ended_at": None,
        "created_at": datetime.utcnow()
    }

    result = await db.video_sessions.insert_one(session_doc)
    session_doc["_id"] = result.inserted_id

    await db.appointments.update_one(
        {"_id": str_to_objectid(appointment_id)},
        {"$set": {"video_session_id": str(result.inserted_id)}}
    )

    return serialize_doc(session_doc)


@router.get("/session/{session_id}", summary="Get video session details")
async def get_video_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    session = await db.video_sessions.find_one({"_id": str_to_objectid(session_id)})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return serialize_doc(session)


@router.patch("/session/{session_id}/end", summary="End video session")
async def end_video_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.video_sessions.find_one_and_update(
        {"_id": str_to_objectid(session_id)},
        {"$set": {"status": "ended", "ended_at": datetime.utcnow()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return serialize_doc(result)
