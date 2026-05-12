from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth_middleware import get_current_user
from app.config.settings import settings
from loguru import logger
import json
import re
import base64

router = APIRouter()


class PrescriptionRequest(BaseModel):
    image_base64: str


class ReportTextRequest(BaseModel):
    description: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None


def call_gemini(image_base64: str, prompt: str) -> dict:
    import google.generativeai as genai
    from PIL import Image
    import io

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    # Convert base64 to image
    if "base64," in image_base64:
        image_data = image_base64.split("base64,")[1]
    else:
        image_data = image_base64

    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes))

    response = model.generate_content([prompt, image])
    content = response.text.strip()

    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return None


@router.post("/read-prescription", summary="AI reads prescription image")
async def read_prescription(data: PrescriptionRequest, current_user: dict = Depends(get_current_user)):
    if not settings.GEMINI_API_KEY:
        return {"success": False, "error": "Gemini API key not configured"}

    try:
        prompt = """You are a medical prescription reader. Analyze this prescription image carefully.

Return ONLY a valid JSON object in this exact format (no extra text):
{
  "doctor_name": "Doctor name if visible or empty string",
  "patient_name": "Patient name if visible or empty string",
  "date": "Date if visible or empty string",
  "hospital": "Hospital or clinic name if visible or empty string",
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "Dosage amount",
      "frequency": "How often to take",
      "duration": "How long to take",
      "instructions": "Special instructions"
    }
  ],
  "diagnosis": "Diagnosis if mentioned or empty string",
  "notes": "Additional notes or empty string",
  "follow_up": "Follow up date if mentioned or empty string"
}"""

        result = call_gemini(data.image_base64, prompt)
        if result:
            return {"success": True, "data": result}
        return {"success": False, "error": "Could not read prescription"}

    except Exception as e:
        logger.error(f"Prescription AI error: {e}")
        return {"success": False, "error": str(e)}


@router.post("/analyze-report", summary="AI analyzes health report")
async def analyze_report(data: PrescriptionRequest, current_user: dict = Depends(get_current_user)):
    if not settings.GEMINI_API_KEY:
        return {"success": False, "error": "Gemini API key not configured"}

    try:
        prompt = """You are a medical report analyzer. Analyze this health/lab report image carefully.

Return ONLY a valid JSON object in this exact format (no extra text):
{
  "report_type": "Type of report",
  "date": "Date if visible or empty string",
  "lab_name": "Laboratory name if visible or empty string",
  "parameters": [
    {
      "name": "Parameter name",
      "value": "Measured value",
      "unit": "Unit of measurement",
      "normal_range": "Normal range if shown",
      "status": "normal or high or low",
      "interpretation": "Brief explanation"
    }
  ],
  "overall_summary": "Overall health summary in simple language",
  "concerns": ["List of concerning values if any"],
  "recommendations": ["List of recommendations"],
  "doctor_to_consult": "Type of specialist to consult if needed"
}"""

        result = call_gemini(data.image_base64, prompt)
        if result:
            return {"success": True, "data": result}
        return {"success": False, "error": "Could not analyze report"}

    except Exception as e:
        logger.error(f"Report AI error: {e}")
        return {"success": False, "error": str(e)}


@router.post("/analyze-report-text", summary="AI analyzes health report from text description")
async def analyze_report_text(data: ReportTextRequest, current_user: dict = Depends(get_current_user)):
    """Analyze a medical report described in text — works with OpenAI when no Gemini key is set."""
    REPORT_ANALYSIS_PROMPT = """You are an expert medical report analyzer. The patient has described their medical/lab report below.
Analyze it carefully and return ONLY a valid JSON object in this exact format (no extra text, no markdown):
{
  "report_type": "Type of report (Blood Test / X-Ray / MRI / ECG / etc.)",
  "parameters": [
    {
      "name": "Parameter name",
      "value": "Measured value if mentioned",
      "unit": "Unit if mentioned",
      "normal_range": "Normal range if mentioned",
      "status": "normal or high or low or unknown",
      "interpretation": "Plain-language explanation of what this means for the patient"
    }
  ],
  "overall_summary": "2-3 sentence plain-language summary of the overall health picture",
  "concerns": ["List any values or findings that are concerning or abnormal"],
  "recommendations": ["Practical recommendations — lifestyle, follow-up tests, urgency"],
  "doctor_to_consult": "Which specialist the patient should see if needed",
  "severity": "Normal / Mild Concern / Moderate Concern / Urgent"
}"""

    context = data.description
    if data.patient_age:
        context += f"\nPatient age: {data.patient_age} years"
    if data.patient_gender:
        context += f"\nPatient gender: {data.patient_gender}"

    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": REPORT_ANALYSIS_PROMPT},
                    {"role": "user", "content": context}
                ],
                temperature=0.2,
                max_tokens=1500
            )
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return {"success": True, "data": result, "source": "openai"}
        except Exception as e:
            logger.warning(f"OpenAI report analysis failed: {e}")

    # Rule-based fallback
    return {
        "success": True,
        "source": "fallback",
        "data": {
            "report_type": "Medical Report",
            "parameters": [],
            "overall_summary": "Your report has been received. Please consult a qualified doctor for a detailed interpretation of your results.",
            "concerns": [],
            "recommendations": [
                "Share this report with your treating doctor",
                "Do not self-medicate based on report values alone",
                "Follow up with a specialist if any values are outside the normal range"
            ],
            "doctor_to_consult": "General Physician",
            "severity": "Unknown — requires professional evaluation"
        }
    }
