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
