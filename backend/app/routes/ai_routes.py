from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from app.middleware.auth_middleware import get_current_user
from app.ai.symptom_analyzer import analyze_symptoms, chat_with_ai
from app.services.doctor_service import get_doctors_by_specialization
from app.schemas.ai_schema import SymptomAnalysisRequest, ChatRequest
from app.database.connection import get_db
from app.utils.helpers import serialize_doc

router = APIRouter()


@router.post("/analyze", summary="Analyze symptoms with AI — inserts new record or updates existing if analysis_id is provided")
async def analyze(data: SymptomAnalysisRequest, current_user: dict = Depends(get_current_user)):
    analysis = await analyze_symptoms(
        symptoms=data.symptoms,
        patient_age=data.patient_age,
        patient_gender=data.patient_gender,
        duration=data.duration,
        severity=data.severity,
        report_context=data.report_context
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
    now = datetime.utcnow()

    # UPDATE existing record if analysis_id provided
    if data.analysis_id:
        try:
            oid = ObjectId(data.analysis_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid analysis_id format")

        existing = await db.medical_reports.find_one(
            {"_id": oid, "patient_id": current_user["id"]}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Report not found or access denied")

        await db.medical_reports.update_one(
            {"_id": oid},
            {"$set": {
                "symptoms": data.symptoms,
                "patient_age": data.patient_age,
                "patient_gender": data.patient_gender,
                "ai_analysis": analysis,
                "updated_at": now,
            }}
        )
        analysis["analysis_id"] = data.analysis_id
        analysis["action"] = "updated"

    # INSERT new record
    else:
        report_doc = {
            "patient_id": current_user["id"],
            "symptoms": data.symptoms,
            "patient_age": data.patient_age,
            "patient_gender": data.patient_gender,
            "ai_analysis": analysis,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.medical_reports.insert_one(report_doc)
        analysis["analysis_id"] = str(result.inserted_id)
        analysis["action"] = "inserted"

    return analysis


@router.post("/chat", summary="Chat with AI health assistant")
async def chat(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    history = [{"role": m.role, "content": m.content} for m in data.history]
    response = await chat_with_ai(
        message=data.message,
        history=history,
        patient_age=data.patient_age,
        patient_gender=data.patient_gender,
        report_context=data.report_context,
        patient_name=data.patient_name or current_user.get("full_name"),
    )
    return {"response": response, "disclaimer": "This is not a medical diagnosis. Please consult a doctor."}


@router.get("/history", summary="Get AI analysis history")
async def get_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.medical_reports.find({"patient_id": current_user["id"]}).sort("created_at", -1).limit(10)
    return [serialize_doc(doc) async for doc in cursor]


@router.get("/disease-stats", summary="Get disease frequency stats for patient")
async def get_disease_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.medical_reports.find({"patient_id": current_user["id"]})
    reports = await cursor.to_list(length=100)

    disease_count = {}
    for report in reports:
        conditions = report.get("ai_analysis", {}).get("possible_conditions", [])
        for condition in conditions:
            name = condition.get("name", "Unknown")
            disease_count[name] = disease_count.get(name, 0) + 1

    data = [{"disease": k, "count": v} for k, v in sorted(disease_count.items(), key=lambda x: -x[1])]
    return {"data": data[:10]}
