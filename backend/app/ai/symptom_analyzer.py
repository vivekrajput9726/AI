import json
import re
from typing import List, Optional
from loguru import logger
from app.config.settings import settings


SYSTEM_PROMPT = """You are an expert medical AI assistant integrated into a healthcare platform.
Your role is to analyze patient symptoms and provide helpful health information.

IMPORTANT RULES:
1. Always include the disclaimer: "This is not a medical diagnosis. Please consult a qualified doctor."
2. Never make definitive diagnoses - only suggest possible conditions
3. For emergencies (chest pain, difficulty breathing, stroke symptoms, severe bleeding), always set emergency_warning to true
4. Be empathetic and professional
5. Recommend appropriate specialist types based on symptoms
6. Include SHAP-style explainability: for each symptom, assign an importance score (0-100) showing how much it contributed to the top diagnosis

You must respond ONLY with a valid JSON object matching this exact structure:
{
  "possible_conditions": [
    {"name": "Condition Name", "probability": "High/Medium/Low", "confidence": 85, "description": "brief description"}
  ],
  "severity_level": "Mild/Moderate/Severe/Emergency",
  "specialist_type": "General Physician/Cardiologist/Neurologist/Pulmonologist/Gastroenterologist/Orthopedist/Dermatologist/ENT Specialist/Psychiatrist/Endocrinologist/Urologist/Gynecologist/Ophthalmologist/Pediatrician",
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "suggested_tests": [
    {"name": "Test Name", "reason": "Why this test is needed", "urgency": "Urgent/Soon/Routine", "type": "Blood/Urine/Imaging/ECG/Other"}
  ],
  "emergency_warning": false,
  "brief_assessment": "A brief 2-3 sentence assessment of the symptoms",
  "shap_insights": [
    {"symptom": "symptom name", "importance": 85, "impact": "positive/negative", "explanation": "why this symptom matters"}
  ],
  "risk_factors": ["risk factor 1", "risk factor 2"],
  "confidence_score": 78
}"""


RULE_BASED_CONDITIONS = {
    "fever": {
        "conditions": [
            {"name": "Viral Fever", "probability": "High", "description": "Common viral infection causing elevated body temperature"},
            {"name": "Dengue Fever", "probability": "Medium", "description": "Mosquito-borne viral disease"},
            {"name": "Typhoid", "probability": "Low", "description": "Bacterial infection from contaminated food/water"}
        ],
        "specialist": "General Physician",
        "severity": "Moderate"
    },
    "headache": {
        "conditions": [
            {"name": "Tension Headache", "probability": "High", "description": "Most common type of headache"},
            {"name": "Migraine", "probability": "Medium", "description": "Intense headache often with nausea and light sensitivity"},
            {"name": "Hypertension", "probability": "Low", "description": "High blood pressure causing head pain"}
        ],
        "specialist": "Neurologist",
        "severity": "Mild"
    },
    "chest pain": {
        "conditions": [
            {"name": "Cardiac Issue", "probability": "High", "description": "Possible heart-related condition"},
            {"name": "Angina", "probability": "Medium", "description": "Chest pain due to reduced blood flow to heart"},
            {"name": "Acid Reflux", "probability": "Medium", "description": "Stomach acid backing up into esophagus"}
        ],
        "specialist": "Cardiologist",
        "severity": "Emergency"
    },
    "cough": {
        "conditions": [
            {"name": "Common Cold", "probability": "High", "description": "Viral upper respiratory tract infection"},
            {"name": "Bronchitis", "probability": "Medium", "description": "Inflammation of bronchial tubes"},
            {"name": "Asthma", "probability": "Low", "description": "Chronic respiratory condition"}
        ],
        "specialist": "Pulmonologist",
        "severity": "Mild"
    },
    "stomach pain": {
        "conditions": [
            {"name": "Gastritis", "probability": "High", "description": "Inflammation of the stomach lining"},
            {"name": "Irritable Bowel Syndrome", "probability": "Medium", "description": "Common intestinal disorder"},
            {"name": "Appendicitis", "probability": "Low", "description": "Inflammation of the appendix"}
        ],
        "specialist": "Gastroenterologist",
        "severity": "Moderate"
    },
    "joint pain": {
        "conditions": [
            {"name": "Arthritis", "probability": "High", "description": "Inflammation of one or more joints"},
            {"name": "Gout", "probability": "Medium", "description": "Type of arthritis with uric acid crystals"},
            {"name": "Rheumatoid Arthritis", "probability": "Low", "description": "Autoimmune joint inflammation"}
        ],
        "specialist": "Orthopedist",
        "severity": "Moderate"
    },
    "skin rash": {
        "conditions": [
            {"name": "Eczema", "probability": "High", "description": "Chronic skin condition causing itchy inflammation"},
            {"name": "Allergic Reaction", "probability": "Medium", "description": "Immune response to allergen"},
            {"name": "Psoriasis", "probability": "Low", "description": "Autoimmune skin disease"}
        ],
        "specialist": "Dermatologist",
        "severity": "Mild"
    }
}


def rule_based_analysis(symptoms_text: str) -> dict:
    """Fallback rule-based analysis when OpenAI is not available."""
    symptoms_lower = symptoms_text.lower()
    matched = None

    for keyword, data in RULE_BASED_CONDITIONS.items():
        if keyword in symptoms_lower:
            matched = data
            break

    if not matched:
        matched = {
            "conditions": [
                {"name": "General Illness", "probability": "Medium", "description": "Requires professional evaluation"},
                {"name": "Viral Infection", "probability": "Medium", "description": "Common viral illness"}
            ],
            "specialist": "General Physician",
            "severity": "Mild"
        }

    emergency = matched["severity"] == "Emergency" or any(
        word in symptoms_lower for word in ["chest pain", "can't breathe", "unconscious", "stroke", "severe bleeding"]
    )

    precautions = [
        "Rest and stay hydrated",
        "Monitor your temperature regularly",
        "Avoid self-medication without doctor's advice",
        "Seek immediate care if symptoms worsen",
        "Maintain a healthy diet and sleep schedule"
    ]

    # Generate basic SHAP insights from symptom keywords
    words = [w.strip() for w in symptoms_text.lower().split() if len(w) > 3]
    shap_insights = []
    for i, word in enumerate(words[:5]):
        shap_insights.append({
            "symptom": word,
            "importance": max(30, 90 - i * 12),
            "impact": "positive",
            "explanation": f"'{word}' is a key indicator for the detected condition"
        })

    return {
        "possible_conditions": matched["conditions"],
        "severity_level": matched["severity"],
        "specialist_type": matched["specialist"],
        "precautions": precautions,
        "emergency_warning": emergency,
        "brief_assessment": f"Based on your symptoms, you may be experiencing {matched['conditions'][0]['name']}. A {matched['specialist']} would be best suited to evaluate your condition. Please consult a healthcare professional for proper diagnosis.",
        "shap_insights": shap_insights,
        "risk_factors": ["Age-related risk", "Environmental factors", "Lifestyle factors"],
        "confidence_score": 65
    }


async def analyze_symptoms(
    symptoms: str,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    duration: Optional[str] = None,
    severity: Optional[str] = None,
    report_context: Optional[str] = None
) -> dict:
    """Analyze symptoms using OpenAI with rule-based fallback."""

    patient_context = f"Patient symptoms: {symptoms}"
    if patient_age:
        patient_context += f"\nPatient age: {patient_age} years"
    if patient_gender:
        patient_context += f"\nPatient gender: {patient_gender}"
    if duration:
        patient_context += f"\nDuration: {duration}"
    if severity:
        patient_context += f"\nSelf-reported severity: {severity}"
    if report_context:
        patient_context += f"\n\nPatient has also uploaded a medical report. Use this data to refine your analysis:\n{report_context}"

    # Try Groq first (free, fast)
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": patient_context}
                ],
                temperature=0.3, max_tokens=1000
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"Groq analysis failed: {e}")

    # Try Gemini
    if settings.GEMINI_API_KEY:
        try:
            from google import genai as gai
            client = gai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = SYSTEM_PROMPT + "\n\nPatient information:\n" + patient_context
            response = client.models.generate_content(model="gemini-2.0-flash-lite", contents=prompt)
            content = response.text.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"Gemini symptom analysis failed: {e}")

    # Fallback to OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": patient_context}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"OpenAI analysis failed: {e}")

    return rule_based_analysis(symptoms)


async def chat_with_ai(
    message: str,
    history: list,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    report_context: Optional[str] = None,
    patient_name: Optional[str] = None,
) -> str:
    """Conversational AI for health queries."""

    patient_info = ""
    if patient_name:
        patient_info += f"Patient name: {patient_name}\n"
    if patient_age:
        patient_info += f"Patient age: {patient_age} years\n"
    if patient_gender:
        patient_info += f"Patient gender: {patient_gender}\n"

    report_section = ""
    if report_context:
        report_section = f"""
The patient has shared their medical report data. Use it to give specific, personalised answers.
Reference exact values from the report and explain them in plain language.

REPORT DATA:
{report_context}
"""

    system = f"""You are Synora AI — a warm, knowledgeable health assistant built into the Synora Health platform (an Indian digital healthcare app).

{f"Patient details: {patient_info}" if patient_info else ""}
{report_section}

YOUR PERSONALITY:
- Friendly, caring, and conversational — like a trusted health advisor
- Use the patient's name occasionally to make it personal
- Keep responses concise (3-6 sentences for simple questions, a bit longer for complex ones)
- Use simple language — avoid heavy medical jargon unless explaining it
- Be empathetic when someone is worried or in pain

YOUR KNOWLEDGE SCOPE:
- Symptoms, possible causes, and when to see a doctor
- Medicines: dosage info, side effects, drug interactions (always advise consulting a pharmacist/doctor)
- Diet, nutrition, and lifestyle for common conditions
- Lab report interpretation (blood counts, sugar, cholesterol, thyroid, etc.)
- Mental health: stress, anxiety, sleep issues
- Indian healthcare context — common conditions in India, ayurvedic context where relevant
- Synora Health platform features (AI Symptom Checker, Lab Reports, Medicine Reminders, Health Goals, Nearby Hospitals)

RESPONSE FORMAT:
- Use **bold** for important terms or key advice
- Use bullet points (•) for lists of symptoms, tips, or steps
- Keep paragraphs short (2-3 sentences max)
- For serious symptoms, clearly say "Please see a doctor soon" or "This needs urgent care"
- Only add the medical disclaimer ONCE if you're giving specific medical advice, not on every single message. For casual questions (greetings, platform questions, general wellness), skip the disclaimer entirely.

WHAT YOU MUST NOT DO:
- Do not diagnose definitively — say "this could be" or "this sounds like"
- Do not recommend prescription drugs by name without advising to consult a doctor
- Do not repeat the disclaimer on every single message — only when giving direct medical advice
- Do not give the same generic response regardless of what the user asked

SYNORA PLATFORM FEATURES YOU CAN GUIDE USERS TO:
- "AI Symptom Checker" — for detailed symptom analysis
- "Lab Reports" — to upload and analyse reports with AI
- "Medicine Reminder" — to set medicine alerts
- "Health Goals" — to track weight, sleep, steps etc.
- "Nearby Hospitals" — to find hospitals and clinics near them
- "Book Appointment" — to book with a specialist doctor"""

    messages = [{"role": "system", "content": system}]
    for h in history[-12:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    # Try Groq first (free, fast)
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.65,
                max_tokens=700
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Groq chat failed: {e}")

    # Fallback to OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.65,
                max_tokens=700
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenAI chat failed: {e}")

    # Fallback to Gemini
    if settings.GEMINI_API_KEY:
        try:
            from google import genai as gai
            client = gai.Client(api_key=settings.GEMINI_API_KEY)
            full_prompt = system + "\n\n" + "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages[1:]])
            response = client.models.generate_content(model="gemini-2.0-flash-lite", contents=full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini chat failed: {e}")

    return "I'm having trouble connecting to my AI service right now. Please try again in a moment, or use the **AI Symptom Checker** on the platform for a detailed analysis."
