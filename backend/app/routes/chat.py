from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from app.database.connection import get_db
from app.utils.jwt_utils import decode_token
from app.utils.helpers import serialize_doc
from app.middleware.auth_middleware import get_current_user
from datetime import datetime
from typing import Dict, List

router = APIRouter()

# Store active connections: {room_id: [websocket, ...]}
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, token: str):
    # Verify token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    role = payload.get("role")

    db = get_db()

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_json()
            message_doc = {
                "room_id": room_id,
                "sender_id": user_id,
                "sender_role": role,
                "message": data.get("message", ""),
                "timestamp": datetime.utcnow().isoformat(),
            }
            # Save to MongoDB
            await db.chat_messages.insert_one(message_doc)

            # Broadcast to all in room
            await manager.broadcast({
                "sender_id": user_id,
                "sender_role": role,
                "message": data.get("message", ""),
                "timestamp": message_doc["timestamp"],
            }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)


@router.get("/history/{room_id}")
async def get_chat_history(room_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.chat_messages.find({"room_id": room_id}).sort("timestamp", 1).limit(100)
    messages = await cursor.to_list(length=100)
    return [serialize_doc(m) for m in messages]


@router.get("/rooms")
async def get_my_chat_rooms(current_user: dict = Depends(get_current_user)):
    """
    Returns chat rooms that have doctor messages the patient hasn't replied to,
    or all rooms a doctor has sent messages in.
    """
    db = get_db()
    user_id = current_user["id"]
    role    = current_user.get("role", "patient")

    if role == "patient":
        # Find all appointments for this patient
        apts = await db.appointments.find({"patient_id": user_id}).to_list(length=None)
        rooms = []
        for apt in apts:
            room_id = f"appointment_{str(apt['_id'])}"
            # Find the latest message in this room sent by someone else (the doctor)
            last_doctor_msg = await db.chat_messages.find_one(
                {"room_id": room_id, "sender_id": {"$ne": user_id}},
                sort=[("timestamp", -1)]
            )
            if not last_doctor_msg:
                continue
            # Find whether the patient has replied AFTER the doctor's last message
            patient_reply = await db.chat_messages.find_one(
                {
                    "room_id": room_id,
                    "sender_id": user_id,
                    "timestamp": {"$gt": last_doctor_msg["timestamp"]},
                }
            )
            rooms.append({
                "room_id":        room_id,
                "appointment_id": str(apt["_id"]),
                "doctor_name":    apt.get("doctor_name", "Your Doctor"),
                "last_message":   last_doctor_msg["message"],
                "last_timestamp": last_doctor_msg["timestamp"],
                "unread":         patient_reply is None,
            })
        # Sort: unread first, then by timestamp
        rooms.sort(key=lambda r: (not r["unread"], r["last_timestamp"]), reverse=True)
        return rooms

    else:
        # Doctor: find all rooms the doctor has chatted in
        # Step 1 — find rooms where doctor sent at least one message
        doctor_sent = await db.chat_messages.distinct("room_id", {"sender_id": user_id})

        rooms = []
        for room_id in doctor_sent:
            # Doctor's last message in this room
            last_doctor_msg = await db.chat_messages.find_one(
                {"room_id": room_id, "sender_id": user_id},
                sort=[("timestamp", -1)]
            )
            # Patient's last message AFTER the doctor's last message
            last_patient_msg = await db.chat_messages.find_one(
                {"room_id": room_id, "sender_id": {"$ne": user_id}},
                sort=[("timestamp", -1)]
            )
            if not last_patient_msg:
                continue  # no patient reply yet

            # Unread = patient replied after the doctor's last message
            unread = last_patient_msg["timestamp"] > last_doctor_msg["timestamp"]

            # Try to find patient name from appointments
            apt = None
            if room_id.startswith("appointment_"):
                apt_id = room_id.replace("appointment_", "")
                try:
                    from app.utils.helpers import str_to_objectid
                    apt = await db.appointments.find_one({"_id": str_to_objectid(apt_id)})
                except Exception:
                    pass

            rooms.append({
                "room_id":        room_id,
                "patient_name":   apt.get("patient_name", "Patient") if apt else "Patient",
                "last_message":   last_patient_msg["message"],
                "last_timestamp": last_patient_msg["timestamp"],
                "unread":         unread,
            })

        # Sort: unread first, then by recency
        rooms.sort(key=lambda r: (not r["unread"], r["last_timestamp"]), reverse=True)
        return rooms[:20]
