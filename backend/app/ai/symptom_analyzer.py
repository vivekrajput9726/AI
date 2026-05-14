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
    report_context: Optional[str] = None
) -> str:
    """Conversational AI for health queries, optionally grounded in an uploaded report."""
    base_system = """You are a compassionate AI health assistant. Help users understand their symptoms and guide them to appropriate care.
    Always remind users to consult real doctors. Be warm, clear, and professional.
    Never make definitive diagnoses. Add the disclaimer at the end of each response."""

    if report_context:
        system = base_system + f"""

IMPORTANT: The patient has uploaded a medical report. Use the following report data to give specific, accurate, and personalised answers. Explain values in simple language, highlight any abnormal findings, and recommend appropriate next steps.

REPORT DATA:
{report_context}

When answering, reference the specific values from the report where relevant. If the user asks about a value in the report, explain what it means in plain language."""
    else:
        system = base_system

    messages = [{"role": "system", "content": system}]
    for h in history[-10:]:
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
                temperature=0.5,
                max_tokens=600
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
                temperature=0.5,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenAI chat failed: {e}")

    return (
        "I understand your health concern. Please consult a qualified doctor for proper evaluation. "
        "If you experience chest pain, difficulty breathing, or severe symptoms, seek emergency care immediately.\n\n"
        "⚠️ This is not a medical diagnosis. Please consult a qualified doctor."
    )
