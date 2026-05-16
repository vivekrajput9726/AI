from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.middleware.auth_middleware import require_doctor
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.services.doctor_service import find_doctor_for_user
from app.ai.patient_analyzer import analyze_patient

router = APIRouter()


async def _gather_patient_data(db, patient_id: str, doctor_id_str: str) -> dict:
    """Collect all relevant patient data from DB for AI analysis."""
    try:
        user = await db.users.find_one({"_id": str_to_objectid(patient_id)})
    except Exception:
        user = None

    profile = {}
    vitals = {}
    if user:
        u = serialize_doc(user)
        u.pop("password_hash", None)
        dob = u.get("date_of_birth") or u.get("DOB") or ""
        age = None
        if dob:
            try:
                from datetime import date
                birth = datetime.strptime(dob[:10], "%Y-%m-%d").date()
                age = (date.today() - birth).days // 365
            except Exception:
                pass
        profile = {
            "full_name": u.get("full_name", "Unknown"),
            "age": age,
            "gender": u.get("gender", ""),
            "date_of_birth": dob,
        }
        vitals = {
            "weight_kg": u.get("weight_kg"),
            "height_cm": u.get("height_cm"),
            "blood_pressure": u.get("blood_pressure"),
            "blood_sugar": u.get("blood_sugar"),
            "heart_rate": u.get("heart_rate"),
        }

    cursor = db.appointments.find({
        "patient_id": patient_id,
        "doctor_id": doctor_id_str,
    }).sort("appointment_date", -1).limit(20)
    appointments = [serialize_doc(a) async for a in cursor]

    symptoms_history = []
    prescriptions = []
    appointment_history = []
    for a in appointments:
        if a.get("symptoms"):
            symptoms_history.append(a["symptoms"])
        if a.get("prescription"):
            prescriptions.append(a["prescription"])
        appointment_history.append({
            "date": a.get("appointment_date", ""),
            "type": a.get("appointment_type", ""),
            "status": a.get("status", ""),
            "notes": a.get("notes", ""),
        })

    cursor = db.health_records.find({"patient_id": patient_id}).sort("created_at", -1).limit(20)
    health_records = [serialize_doc(r) async for r in cursor]
    for r in health_records:
        r.pop("file_data", None)

    # Pull condition names from previous AI analyses to enrich symptoms
    cursor = db.medical_reports.find({"patient_id": patient_id}).sort("created_at", -1).limit(3)
    past_analyses = [serialize_doc(r) async for r in cursor]
    for pa in past_analyses:
        ai = pa.get("ai_analysis", {})
        if ai and isinstance(ai, dict):
            for c in ai.get("possible_conditions", [])[:2]:
                if c.get("name"):
                    symptoms_history.append(c["name"])

    return {
        "profile": profile,
        "vitals": vitals,
        "symptoms_history": list(dict.fromkeys(filter(None, symptoms_history))),
        "health_records": health_records,
        "prescriptions": list(filter(None, prescriptions)),
        "appointment_history": appointment_history,
    }


@router.post("/patient/{patient_id}/analyze", summary="Generate AI clinical analysis for a patient (doctor only)")
async def generate_patient_analysis(
    patient_id: str,
    current_user: dict = Depends(require_doctor),
):
    db = get_db()

    doctor = await find_doctor_for_user(current_user["id"])
    if not doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor profile not found")

    doctor_id_str = str(doctor["_id"])

    existing_apt = await db.appointments.find_one({
        "patient_id": patient_id,
        "doctor_id": doctor_id_str,
    })
    if not existing_apt:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied — no appointment relationship with this patient",
        )

    patient_data = await _gather_patient_data(db, patient_id, doctor_id_str)
    analysis = await analyze_patient(patient_data)

    record = {
        "patient_id": patient_id,
        "doctor_id": doctor_id_str,
        "doctor_user_id": current_user["id"],
        "analysis": analysis,
        "patient_snapshot": {
            "full_name": patient_data["profile"].get("full_name", ""),
            "age": patient_data["profile"].get("age"),
            "gender": patient_data["profile"].get("gender", ""),
            "vitals": patient_data["vitals"],
            "symptom_count": len(patient_data["symptoms_history"]),
            "record_count": len(patient_data["health_records"]),
        },
        "generated_at": datetime.utcnow(),
    }
    result = await db.patient_ai_analyses.insert_one(record)

    return {
        "success": True,
        "analysis": analysis,
        "generated_at": record["generated_at"].isoformat(),
        "analysis_id": str(result.inserted_id),
        "data_used": {
            "symptoms": len(patient_data["symptoms_history"]),
            "records": len(patient_data["health_records"]),
            "appointments": len(patient_data["appointment_history"]),
            "prescriptions": len(patient_data["prescriptions"]),
        },
    }


@router.get("/patient/{patient_id}/analysis", summary="Get latest stored AI analysis for a patient (doctor only)")
async def get_patient_analysis(
    patient_id: str,
    current_user: dict = Depends(require_doctor),
):
    db = get_db()

    doctor = await find_doctor_for_user(current_user["id"])
    if not doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor profile not found")

    doctor_id_str = str(doctor["_id"])

    doc = await db.patient_ai_analyses.find_one(
        {"patient_id": patient_id, "doctor_id": doctor_id_str},
        sort=[("generated_at", -1)],
    )

    if not doc:
        return {"exists": False, "analysis": None, "generated_at": None}

    doc = serialize_doc(doc)
    return {
        "exists": True,
        "analysis": doc.get("analysis"),
        "generated_at": doc.get("generated_at"),
        "analysis_id": doc.get("id"),
        "patient_snapshot": doc.get("patient_snapshot"),
    }
