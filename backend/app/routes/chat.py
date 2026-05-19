from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.database.connection import get_db
from app.utils.jwt_utils import decode_token
from app.utils.helpers import serialize_doc
from app.middleware.auth_middleware import get_current_user
from datetime import datetime
from typing import Dict, List
from bson import ObjectId

router = APIRouter()


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
            await db.chat_messages.insert_one(message_doc)
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
    db = get_db()
    user_id = current_user["id"]
    role = current_user.get("role", "patient")

    if role == "patient":
        apts = await db.appointments.find({"patient_id": user_id}).to_list(length=None)
        rooms = []
        seen = set()
        for apt in apts:
            room_id = f"appointment_{str(apt['_id'])}"
            if room_id in seen:
                continue
            seen.add(room_id)
            msgs = await db.chat_messages.find(
                {"room_id": room_id}
            ).sort("timestamp", -1).limit(1).to_list(1)
            if not msgs:
                continue
            last = msgs[0]
            rooms.append({
                "room_id":        room_id,
                "appointment_id": str(apt["_id"]),
                "doctor_id":      apt.get("doctor_id", ""),
                "doctor_name":    apt.get("doctor_name", "Doctor"),
                "last_message":   last["message"],
                "last_timestamp": last["timestamp"],
                "unread":         last["sender_id"] != user_id,
            })
        rooms.sort(key=lambda r: (not r["unread"], r["last_timestamp"]), reverse=True)
        return rooms

    # Doctor role: resolve doctors-collection _id from user_id
    doctor_profile = await db.doctors.find_one({"user_id": user_id})
    if not doctor_profile:
        u = await db.users.find_one({"_id": ObjectId(user_id)})
        if u:
            doctor_profile = await db.doctors.find_one({"email": u.get("email", "")})
    if not doctor_profile:
        return []

    doctor_doc_id = str(doctor_profile["_id"])

    # Find all rooms with messages that belong to this doctor's appointments
    all_room_ids = await db.chat_messages.distinct("room_id")
    rooms = []
    for room_id in all_room_ids:
        if not room_id.startswith("appointment_"):
            continue
        apt_id_str = room_id.replace("appointment_", "")
        try:
            apt = await db.appointments.find_one({"_id": ObjectId(apt_id_str)})
        except Exception:
            continue
        if not apt:
            continue
        if apt.get("doctor_id") != doctor_doc_id:
            continue
        msgs = await db.chat_messages.find(
            {"room_id": room_id}
        ).sort("timestamp", -1).limit(1).to_list(1)
        if not msgs:
            continue
        last = msgs[0]
        rooms.append({
            "room_id":        room_id,
            "appointment_id": apt_id_str,
            "patient_name":   apt.get("patient_name", "Patient"),
            "last_message":   last["message"],
            "last_timestamp": last["timestamp"],
            "unread":         last["sender_id"] != user_id,
        })

    rooms.sort(key=lambda r: (not r["unread"], r["last_timestamp"]), reverse=True)
    return rooms[:20]
