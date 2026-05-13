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


REPORT_PROMPT = """You are an expert medical report analyzer with OCR capability.
CAREFULLY read ALL text visible in this image. Extract EVERY number, value, and parameter you can see.

This image may be a lab report, blood test, X-ray, MRI, ECG, prescription, or medical document.

IMPORTANT RULES:
- Read the ACTUAL values shown in the image, do not guess or make up values
- If you can see text/numbers, extract them exactly as written
- If the image is blurry or unreadable, set overall_summary to explain this

Return ONLY a valid JSON object (no extra text, no markdown):
{
  "report_type": "Exact type detected (Blood Test / X-Ray / Prescription / ECG / MRI / Urine Test / etc.)",
  "severity": "Normal or Mild Concern or Moderate Concern or Urgent",
  "overall_summary": "2-3 sentence plain-language summary of what you found in this report",
  "parameters": [
    {
      "name": "Exact parameter name from the report",
      "value": "Exact value shown in report",
      "unit": "Unit shown (g/dL, mg/dL, cells/mcL, etc.)",
      "normal_range": "Normal range if shown in report",
      "status": "normal or high or low or unknown",
      "interpretation": "What this value means for the patient in simple words"
    }
  ],
  "concerns": ["List specific abnormal values or findings with their actual numbers"],
  "recommendations": ["Specific actionable recommendations based on these results"],
  "doctor_to_consult": "Specific specialist type based on findings"
}"""


async def analyze_with_openai(image_base64: str) -> dict:
    """Use OpenAI GPT-4o-mini vision to analyze an image."""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Ensure proper data URL format
    if not image_base64.startswith("data:"):
        image_base64 = f"data:image/jpeg;base64,{image_base64}"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": REPORT_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_base64, "detail": "high"}}
                ]
            }
        ],
        max_tokens=1200,
        temperature=0.2
    )
    content = response.choices[0].message.content.strip()
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return None


@router.post("/analyze-report", summary="AI analyzes health report or camera image")
async def analyze_report(data: PrescriptionRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = None

        # Try OpenAI Vision first (fast, reliable)
        if settings.OPENAI_API_KEY:
            try:
                result = await analyze_with_openai(data.image_base64)
            except Exception as e:
                logger.warning(f"OpenAI vision failed, trying Gemini: {e}")

        # Fallback to Gemini
        if not result and settings.GEMINI_API_KEY:
            try:
                result = call_gemini(data.image_base64, REPORT_PROMPT)
            except Exception as e:
                logger.warning(f"Gemini also failed: {e}")

        if result:
            return {"success": True, "data": result}

        return {"success": False, "error": "AI analysis failed. Please ensure image is clear and try again."}

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
