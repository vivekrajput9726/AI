from fastapi import APIRouter, Depends
from datetime import datetime
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.schemas.user_schema import UserUpdateRequest
from app.services.health_score_service import calculate_health_score

router = APIRouter()


@router.get("/me", summary="Get current user profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/me/health-score", summary="Get calculated health score for current user")
async def get_health_score(current_user: dict = Depends(get_current_user)):
    # Fetch fresh user data from DB to ensure latest vitals are used
    db = get_db()
    fresh_user = await db.users.find_one({"_id": str_to_objectid(current_user["id"])})
    if not fresh_user:
        return calculate_health_score(current_user)
    return calculate_health_score(serialize_doc(fresh_user))


@router.put("/me", summary="Update current user profile")
async def update_profile(data: UserUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    # exclude_none so only explicitly-provided fields are written; preserves existing values
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update:
        return current_user
    update["updated_at"] = datetime.utcnow()
    result = await db.users.find_one_and_update(
        {"_id": str_to_objectid(current_user["id"])},
        {"$set": update},
        return_document=True
    )
    return serialize_doc(result)


@router.get("/history", summary="Get user's symptom history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.medical_reports.find({"patient_id": current_user["id"]}).sort("created_at", -1).limit(20)
    return [serialize_doc(doc) async for doc in cursor]
