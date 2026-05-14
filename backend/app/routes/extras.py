from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user, require_patient
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from app.config.settings import settings
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

# ── Symptom Diary ─────────────────────────────────────────────────────────────
class DiaryEntry(BaseModel):
    date: str
    symptoms: str
    mood: int          # 1-5
    pain_level: int    # 0-10
    energy_level: int  # 1-5
    notes: Optional[str] = ""
    temperature: Optional[float] = None
    weight: Optional[float] = None

@router.post("/diary", summary="Add diary entry")
async def add_diary(data: DiaryEntry, current_user: dict = Depends(require_patient)):
    db = get_db()
    doc = {**data.dict(), "patient_id": current_user["id"], "created_at": datetime.utcnow()}
    result = await db.symptom_diary.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.get("/diary", summary="Get diary entries")
async def get_diary(current_user: dict = Depends(require_patient)):
    db = get_db()
    cursor = db.symptom_diary.find({"patient_id": current_user["id"]}).sort("date", -1).limit(30)
    return [serialize_doc(d) async for d in cursor]

@router.delete("/diary/{entry_id}", summary="Delete diary entry")
async def delete_diary(entry_id: str, current_user: dict = Depends(require_patient)):
    db = get_db()
    await db.symptom_diary.delete_one({"_id": str_to_objectid(entry_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}

# ── Vaccination Tracker ───────────────────────────────────────────────────────
class Vaccine(BaseModel):
    name: str
    date_taken: Optional[str] = ""
    next_due: Optional[str] = ""
    provider: Optional[str] = ""
    notes: Optional[str] = ""
    status: str = "taken"  # taken | due | upcoming

@router.get("/vaccines", summary="Get vaccinations")
async def get_vaccines(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.vaccinations.find({"patient_id": current_user["id"]}).sort("date_taken", -1)
    return [serialize_doc(v) async for v in cursor]

@router.post("/vaccines", summary="Add vaccination")
async def add_vaccine(data: Vaccine, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {**data.dict(), "patient_id": current_user["id"], "created_at": datetime.utcnow()}
    result = await db.vaccinations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.delete("/vaccines/{vaccine_id}", summary="Delete vaccination")
async def delete_vaccine(vaccine_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.vaccinations.delete_one({"_id": str_to_objectid(vaccine_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}

# ── Health Tips ───────────────────────────────────────────────────────────────
@router.get("/health-tips", summary="Get AI health tips")
async def get_health_tips(current_user: dict = Depends(get_current_user)):
    import random
    tips = [
        {"tip": "Drink at least 8 glasses of water daily to stay hydrated.", "category": "Hydration", "icon": "💧"},
        {"tip": "Walk for at least 30 minutes every day to improve heart health.", "category": "Fitness", "icon": "🚶"},
        {"tip": "Eat 5 portions of fruits and vegetables every day for essential vitamins.", "category": "Nutrition", "icon": "🥗"},
        {"tip": "Sleep 7-9 hours per night. Quality sleep repairs your body and mind.", "category": "Sleep", "icon": "😴"},
        {"tip": "Practice 5 minutes of deep breathing to reduce stress and anxiety.", "category": "Mental Health", "icon": "🧘"},
        {"tip": "Wash hands frequently — it prevents 80% of common infections.", "category": "Hygiene", "icon": "🧼"},
        {"tip": "Limit screen time before bed. Blue light disrupts melatonin production.", "category": "Sleep", "icon": "📱"},
        {"tip": "Eat breakfast every day. It boosts metabolism and improves concentration.", "category": "Nutrition", "icon": "🍳"},
        {"tip": "Take a 5-minute break every hour if you sit at a desk.", "category": "Fitness", "icon": "⏰"},
        {"tip": "Include protein in every meal — eggs, dal, paneer, or nuts.", "category": "Nutrition", "icon": "💪"},
        {"tip": "Regular health check-ups can detect problems before they become serious.", "category": "Prevention", "icon": "🏥"},
        {"tip": "Avoid smoking. It's the leading cause of preventable death worldwide.", "category": "Prevention", "icon": "🚭"},
        {"tip": "Laughing reduces stress hormones and boosts your immune system.", "category": "Mental Health", "icon": "😄"},
        {"tip": "Sunlight in the morning helps regulate your body clock and mood.", "category": "Wellness", "icon": "☀️"},
        {"tip": "Maintain a healthy weight — even a 5% reduction improves many conditions.", "category": "Fitness", "icon": "⚖️"},
    ]
    selected = random.sample(tips, min(5, len(tips)))
    return {"tips": selected, "date": datetime.utcnow().strftime("%Y-%m-%d")}

# ── Doctor Revenue ────────────────────────────────────────────────────────────
@router.get("/doctor-revenue", summary="Doctor revenue stats")
async def doctor_revenue(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["doctor", "admin"]:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=403, detail="Doctors only")
    db = get_db()
    doctor = await db.doctors.find_one({"user_id": current_user["id"]})
    if not doctor:
        return {"total": 0, "monthly": [], "by_type": [], "completed": 0, "pending": 0}

    doctor_id = str(doctor["_id"])
    cursor = db.appointments.find({"doctor_id": doctor_id})
    apts = [serialize_doc(a) async for a in cursor]

    total_revenue = sum(a.get("consultation_fee", 0) for a in apts if a.get("status") == "completed")
    completed = len([a for a in apts if a.get("status") == "completed"])
    pending = len([a for a in apts if a.get("status") == "pending"])

    # Monthly revenue
    from collections import defaultdict
    monthly = defaultdict(float)
    for a in apts:
        if a.get("status") == "completed":
            m = a.get("appointment_date", "")[:7]
            monthly[m] += a.get("consultation_fee", 0)
    monthly_list = [{"month": k, "revenue": v} for k, v in sorted(monthly.items())[-6:]]

    # By type
    type_rev = defaultdict(float)
    for a in apts:
        if a.get("status") == "completed":
            type_rev[a.get("appointment_type", "video")] += a.get("consultation_fee", 0)
    by_type = [{"type": k, "revenue": v} for k, v in type_rev.items()]

    return {"total_revenue": total_revenue, "completed": completed, "pending": pending, "monthly": monthly_list, "by_type": by_type, "total_appointments": len(apts)}


# ── BMI AI Advice ─────────────────────────────────────────────────────────────
class BMIAdviceRequest(BaseModel):
    bmi: float
    category: str
    bmr: int
    age: int
    gender: str
    weight_kg: float
    height_cm: float

@router.post("/bmi-advice", summary="Get AI health advice based on BMI")
async def bmi_advice(data: BMIAdviceRequest, current_user: dict = Depends(get_current_user)):
    import json, re
    from loguru import logger

    prompt = f"""You are a health and fitness advisor. Give personalized advice for this person:
- BMI: {data.bmi} ({data.category})
- Age: {data.age} years, Gender: {data.gender}
- Weight: {data.weight_kg} kg, Height: {data.height_cm} cm
- Daily Calorie Needs (BMR): {data.bmr} kcal/day

Return ONLY a valid JSON object (no markdown, no extra text):
{{
  "goal": "One personalized health goal sentence for this person based on their BMI",
  "diet": ["4 specific food/diet tips for their BMI category"],
  "exercise": ["3 specific exercises suited to their fitness level"],
  "lifestyle": ["3 daily habit recommendations"],
  "risk": "Main health risk to watch for at this BMI level",
  "motivational": "One short encouraging message"
}}"""

    # Try Groq first
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            res = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5, max_tokens=600
            )
            content = res.choices[0].message.content.strip()
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return {"success": True, "data": json.loads(match[0])}
        except Exception as e:
            logger.warning(f"Groq BMI advice failed: {e}")

    # Fallback static advice
    advice = {
        "Underweight":    {"goal": "Gain weight gradually with nutrient-rich foods.", "diet": ["Eat calorie-dense foods like nuts and avocado", "Have 5-6 small meals a day", "Include protein in every meal", "Drink healthy smoothies"], "exercise": ["Light weight training", "Yoga for strength", "Walking 30 min daily"], "lifestyle": ["Sleep 8 hours", "Reduce stress", "Track your meals"], "risk": "Nutritional deficiencies and low immunity", "motivational": "Every healthy meal is a step toward your goal!"},
        "Normal Weight":  {"goal": "Maintain your healthy weight with balanced habits.", "diet": ["Eat plenty of vegetables and fruits", "Stay hydrated with 8 glasses of water", "Limit processed foods", "Include whole grains"], "exercise": ["30 min cardio 5x/week", "Strength training 3x/week", "Stretching daily"], "lifestyle": ["Regular health checkups", "7-8 hours sleep", "Manage stress"], "risk": "Maintain weight to avoid future health issues", "motivational": "You are doing great — keep it up!"},
        "Overweight":     {"goal": "Lose 0.5–1 kg per week with diet and exercise.", "diet": ["Cut sugary drinks completely", "Eat more protein and fiber", "Control portion sizes", "Avoid fried foods"], "exercise": ["45 min brisk walking daily", "Swimming or cycling", "HIIT workouts 3x/week"], "lifestyle": ["Track calories", "Avoid late night eating", "Stay active throughout day"], "risk": "Type 2 diabetes and heart disease risk increases", "motivational": "Small consistent changes lead to big results!"},
    }.get(data.category, {
        "goal": "Focus on gradual, sustainable weight loss with medical support.",
        "diet": ["Reduce calorie intake by 500 kcal/day", "Eat more vegetables", "Avoid sugar and processed food", "Stay hydrated"],
        "exercise": ["Start with 20 min walking", "Low impact exercises", "Consult a fitness trainer"],
        "lifestyle": ["Consult a doctor", "Track your progress weekly", "Join a support group"],
        "risk": "High risk of diabetes, heart disease, and joint problems",
        "motivational": "Every step forward counts — you can do this!"
    })
    return {"success": True, "data": advice}
