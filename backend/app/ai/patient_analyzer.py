import json
import re
from typing import Optional
from loguru import logger
from app.config.settings import settings


CLINICAL_SYSTEM_PROMPT = """You are an expert clinical AI assistant integrated into a doctor-facing healthcare dashboard.
Your role is to analyze a patient's complete medical profile and provide actionable clinical insights for the treating physician.

IMPORTANT RULES:
1. AI suggestions are assistive ONLY — they do not replace the doctor's clinical judgment.
2. Never make definitive diagnoses — use probabilistic language ("likely", "possible", "suggests").
3. For emergency indicators (chest pain, stroke signs, severe breathing difficulty, shock), always set emergency_indicators to true.
4. Be concise and clinically precise — this is for a trained doctor, not a layperson.
5. Base analysis on all available data: vitals, symptoms, records, history, prescriptions.
6. Confidence score must reflect the amount and quality of available data.

AGE-BASED CLINICAL RULES:
- Child (<15): Flag pediatric-specific risks, note immature immune system, recommend Pediatrician
- Elderly (60+): Assume comorbidities, polypharmacy risk, escalate severity, recommend geriatric review
- Middle-aged (36-59): Elevate suspicion for hypertension, diabetes, metabolic syndrome

You must respond ONLY with a valid JSON object matching this exact structure:
{
  "possible_conditions": [
    {"name": "Condition Name", "probability": "High/Medium/Low", "confidence": 85, "description": "brief clinical description"}
  ],
  "severity_estimation": "Mild/Moderate/Severe/Critical",
  "key_symptoms_detected": ["symptom 1", "symptom 2", "symptom 3"],
  "important_findings": ["finding from reports or history 1", "finding 2"],
  "recommended_tests": [
    {"name": "Test Name", "reason": "Clinical rationale", "urgency": "Urgent/Soon/Routine", "type": "Blood/Urine/Imaging/ECG/Other"}
  ],
  "suggested_specialist": "Cardiologist/General Physician/etc",
  "risk_alerts": ["alert 1", "alert 2"],
  "emergency_indicators": false,
  "confidence_score": 78,
  "patient_summary": "A 3-5 sentence clinical summary covering the patient's presentation, key concerns, and recommended course of action.",
  "ai_disclaimer": "AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by the treating physician."
}"""


def _build_patient_context(patient_data: dict) -> str:
    profile = patient_data.get("profile", {})
    vitals = patient_data.get("vitals", {})
    symptoms_history = patient_data.get("symptoms_history", [])
    health_records = patient_data.get("health_records", [])
    prescriptions = patient_data.get("prescriptions", [])
    appointment_history = patient_data.get("appointment_history", [])

    lines = ["=== PATIENT CLINICAL DATA ===\n"]

    name = profile.get("full_name", "Unknown")
    age = profile.get("age", "Unknown")
    gender = profile.get("gender", "Unknown")
    dob = profile.get("date_of_birth", "")
    lines.append(f"Patient: {name} | Age: {age} | Gender: {gender}")
    if dob:
        lines.append(f"Date of Birth: {dob}")

    if vitals:
        lines.append("\n--- VITALS ---")
        if vitals.get("weight_kg"):
            lines.append(f"Weight: {vitals['weight_kg']} kg")
        if vitals.get("height_cm"):
            h = vitals["height_cm"]
            bmi = round(vitals["weight_kg"] / ((h / 100) ** 2), 1) if vitals.get("weight_kg") and h else None
            lines.append(f"Height: {h} cm" + (f" | BMI: {bmi}" if bmi else ""))
        if vitals.get("blood_pressure"):
            lines.append(f"Blood Pressure: {vitals['blood_pressure']} mmHg")
        if vitals.get("blood_sugar"):
            lines.append(f"Blood Sugar: {vitals['blood_sugar']} mg/dL")
        if vitals.get("heart_rate"):
            lines.append(f"Heart Rate: {vitals['heart_rate']} bpm")

    if symptoms_history:
        lines.append("\n--- REPORTED SYMPTOMS (from consultations) ---")
        for i, s in enumerate(symptoms_history[:10], 1):
            lines.append(f"{i}. {s}")

    if health_records:
        lines.append("\n--- HEALTH RECORDS & UPLOADED REPORTS ---")
        for r in health_records[:15]:
            rec_type = r.get("record_type", "record").title()
            title = r.get("title", "Untitled")
            desc = r.get("description", "")
            date = r.get("date", "")
            doc = r.get("doctor_name", "")
            entry = f"[{rec_type}] {title}"
            if date:
                entry += f" ({date})"
            if doc:
                entry += f" — Dr. {doc}"
            if desc:
                entry += f"\n   Details: {desc}"
            lines.append(entry)

    if prescriptions:
        lines.append("\n--- PRESCRIPTION HISTORY ---")
        for p in prescriptions[:10]:
            lines.append(f"• {p}")

    if appointment_history:
        lines.append("\n--- CONSULTATION HISTORY ---")
        for a in appointment_history[:8]:
            date = a.get("date", "")
            status = a.get("status", "")
            apt_type = a.get("type", "")
            notes = a.get("notes", "")
            entry = f"[{date}] {apt_type.title()} — {status.title()}"
            if notes:
                entry += f": {notes}"
            lines.append(entry)

    lines.append("\n=== END OF PATIENT DATA ===")
    return "\n".join(lines)


def _rule_based_fallback(patient_data: dict) -> dict:
    profile = patient_data.get("profile", {})
    symptoms = " ".join(patient_data.get("symptoms_history", [])).lower()
    age = profile.get("age")
    vitals = patient_data.get("vitals", {})

    conditions = [{"name": "General Medical Condition", "probability": "Medium", "confidence": 50, "description": "Requires comprehensive clinical evaluation"}]
    severity = "Moderate"
    specialist = "General Physician"
    risk_alerts = []
    emergency = False

    if "chest pain" in symptoms or "chest" in symptoms:
        conditions = [{"name": "Cardiac Condition", "probability": "High", "confidence": 70, "description": "Chest pain warrants cardiac evaluation"}]
        specialist = "Cardiologist"
        severity = "Severe"
        emergency = True
        risk_alerts.append("Chest pain — immediate cardiac evaluation required")
    elif "fever" in symptoms:
        conditions = [
            {"name": "Viral Fever", "probability": "High", "confidence": 65, "description": "Common viral infection"},
            {"name": "Dengue", "probability": "Low", "confidence": 30, "description": "Mosquito-borne viral illness"},
        ]
        specialist = "General Physician"
        severity = "Moderate"
    elif "diabetes" in symptoms or (vitals.get("blood_sugar") and vitals["blood_sugar"] > 200):
        conditions = [{"name": "Diabetes Mellitus", "probability": "High", "confidence": 75, "description": "Elevated blood glucose levels"}]
        specialist = "Endocrinologist"
        severity = "Moderate"
        risk_alerts.append("High blood sugar detected — diabetes management review needed")

    bp = vitals.get("blood_pressure", "")
    if isinstance(bp, str) and "/" in bp:
        try:
            systolic = int(bp.split("/")[0])
            if systolic >= 140:
                risk_alerts.append(f"Hypertension alert — BP {bp} mmHg")
        except Exception:
            pass

    if age is not None:
        if age < 15:
            specialist = "Pediatrician"
            risk_alerts.append("Pediatric patient — immature immune system, monitor closely")
            if severity == "Mild":
                severity = "Moderate"
        elif age >= 60:
            risk_alerts.append(f"Elderly patient (age {age}) — elevated comorbidity and polypharmacy risk")
            severities = ["Mild", "Moderate", "Severe", "Critical"]
            idx = severities.index(severity) if severity in severities else 1
            severity = severities[min(idx + 1, 3)]

    if emergency:
        severity = "Critical"

    health_records = patient_data.get("health_records", [])
    findings = []
    for r in health_records[:3]:
        desc = r.get("description", "")
        if desc:
            findings.append(desc[:100])
    if not findings:
        findings = ["No detailed report findings available — manual review recommended"]

    return {
        "possible_conditions": conditions,
        "severity_estimation": severity,
        "key_symptoms_detected": [s.strip() for s in patient_data.get("symptoms_history", [])[:5]],
        "important_findings": findings,
        "recommended_tests": [
            {"name": "Complete Blood Count (CBC)", "reason": "Baseline hematological assessment", "urgency": "Soon", "type": "Blood"},
            {"name": "Blood Glucose (Fasting)", "reason": "Metabolic baseline", "urgency": "Routine", "type": "Blood"},
            {"name": "Urine Routine", "reason": "Renal and metabolic screening", "urgency": "Routine", "type": "Urine"},
        ],
        "suggested_specialist": specialist,
        "risk_alerts": risk_alerts,
        "emergency_indicators": emergency,
        "confidence_score": 45,
        "patient_summary": (
            f"Patient presents with {', '.join(patient_data.get('symptoms_history', ['unspecified symptoms'])[:3]) or 'unspecified complaints'}. "
            f"Based on available clinical data, a {severity.lower()} clinical picture is suggested. "
            f"Consultation with a {specialist} is recommended. "
            "Please review uploaded records and vitals for a complete clinical assessment."
        ),
        "ai_disclaimer": "AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by the treating physician.",
    }


async def analyze_patient(patient_data: dict) -> dict:
    """Generate comprehensive AI clinical analysis for a specific patient."""
    patient_context = _build_patient_context(patient_data)

    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": CLINICAL_SYSTEM_PROMPT},
                    {"role": "user", "content": patient_context},
                ],
                temperature=0.2,
                max_tokens=1500,
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result.setdefault("ai_disclaimer", "AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by the treating physician.")
                return result
        except Exception as e:
            logger.warning(f"Groq patient analysis failed: {e}")

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash-lite")
            prompt = CLINICAL_SYSTEM_PROMPT + "\n\n" + patient_context
            response = model.generate_content(prompt)
            content = response.text.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result.setdefault("ai_disclaimer", "AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by the treating physician.")
                return result
        except Exception as e:
            logger.warning(f"Gemini patient analysis failed: {e}")

    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": CLINICAL_SYSTEM_PROMPT},
                    {"role": "user", "content": patient_context},
                ],
                temperature=0.2,
                max_tokens=1500,
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result.setdefault("ai_disclaimer", "AI analysis is for clinical decision support only. Final diagnosis and treatment decisions must be made by the treating physician.")
                return result
        except Exception as e:
            logger.warning(f"OpenAI patient analysis failed: {e}")

    logger.warning("All AI providers failed — using rule-based fallback for patient analysis")
    return _rule_based_fallback(patient_data)
