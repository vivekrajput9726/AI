from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import require_patient
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class GoalIn(BaseModel):
    id: str           # template id e.g. "weight", "sleep"
    label: str
    unit: str
    target: float
    current: float = 0
    icon: Optional[str] = "🎯"

class GoalUpdate(BaseModel):
    current: float

@router.get("/", summary="Get my health goals")
async def get_goals(current_user: dict = Depends(require_patient)):
    db = get_db()
    cursor = db.health_goals.find({"patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(g) async for g in cursor]

@router.post("/", summary="Add health goal")
async def add_goal(data: GoalIn, current_user: dict = Depends(require_patient)):
    db = get_db()
    # Remove existing goal of same type
    await db.health_goals.delete_one({"patient_id": current_user["id"], "id": data.id})
    doc = {
        **data.dict(),
        "patient_id": current_user["id"],
        "status": "active",
        "history": [],
        "created_at": datetime.utcnow()
    }
    result = await db.health_goals.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.put("/{goal_id}/progress", summary="Update goal progress")
async def update_progress(goal_id: str, data: GoalUpdate, current_user: dict = Depends(require_patient)):
    db = get_db()
    log_entry = {"value": data.current, "date": datetime.utcnow().isoformat()}
    await db.health_goals.update_one(
        {"_id": str_to_objectid(goal_id), "patient_id": current_user["id"]},
        {
            "$set": {"current": data.current, "updated_at": datetime.utcnow()},
            "$push": {"history": log_entry}
        }
    )
    return {"message": "Progress updated"}

@router.delete("/{goal_id}", summary="Delete goal")
async def delete_goal(goal_id: str, current_user: dict = Depends(require_patient)):
    db = get_db()
    await db.health_goals.delete_one({"_id": str_to_objectid(goal_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}
