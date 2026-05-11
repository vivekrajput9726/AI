from fastapi import APIRouter, Depends
from datetime import datetime
from app.middleware.auth_middleware import get_current_user
from app.ai.symptom_analyzer import analyze_symptoms, chat_with_ai
from app.services.doctor_service import get_doctors_by_specialization
from app.schemas.ai_schema import SymptomAnalysisRequest, ChatRequest
from app.database.connection import get_db
from app.utils.helpers import serialize_doc

router = APIRouter()


@router.post("/analyze", summary="Analyze symptoms with AI")
async def analyze(data: SymptomAnalysisRequest, current_user: dict = Depends(get_current_user)):
    analysis = await analyze_symptoms(
        symptoms=data.symptoms,
        patient_age=data.patient_age,
        patient_gender=data.patient_gender,
        duration=data.duration,
        severity=data.severity
    )

    specialist_type = analysis.get("specialist_type", "General Physician")
    recommended_doctors = await get_doctors_by_specialization(specialist_type)

    if not recommended_doctors:
        recommended_doctors = await get_doctors_by_specialization("General Physician")

    doctors_with_reason = []
    for doc in recommended_doctors[:4]:
        doc["match_reason"] = f"Recommended {specialist_type} specialist based on your symptoms"
        doctors_with_reason.append(doc)

    analysis["recommended_doctors"] = doctors_with_reason
    analysis["disclaimer"] = "This is not a medical diagnosis. Please consult a qualified doctor."

    db = get_db()
    report_doc = {
        "patient_id": current_user["id"],
        "symptoms": data.symptoms,
        "ai_analysis": analysis,
        "created_at": datetime.utcnow()
    }
    result = await db.medical_reports.insert_one(report_doc)
    analysis["analysis_id"] = str(result.inserted_id)

    return analysis


@router.post("/chat", summary="Chat with AI health assistant")
async def chat(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    history = [{"role": m.role, "content": m.content} for m in data.history]
    response = await chat_with_ai(
        message=data.message,
        history=history,
        patient_age=data.patient_age,
        patient_gender=data.patient_gender
    )
    return {"response": response, "disclaimer": "This is not a medical diagnosis. Please consult a doctor."}


@router.get("/history", summary="Get AI analysis history")
async def get_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.medical_reports.find({"patient_id": current_user["id"]}).sort("created_at", -1).limit(10)
    return [serialize_doc(doc) async for doc in cursor]
