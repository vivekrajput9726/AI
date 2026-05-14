from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc
from app.config.settings import settings
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()


class DrugCheckRequest(BaseModel):
    medicines: List[str]


class AssessmentResult(BaseModel):
    assessment_type: str
    score: int
    level: str
    answers: List[dict]


@router.post("/drug-interaction", summary="Check drug interactions")
async def check_drug_interaction(data: DrugCheckRequest, current_user: dict = Depends(get_current_user)):
    if len(data.medicines) < 2:
        return {"result": "Please enter at least 2 medicines to check interactions.", "safe": True, "interactions": []}

    medicines_list = ", ".join(data.medicines)

    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """You are a clinical pharmacist AI. Analyze drug interactions.
Respond ONLY with a valid JSON object:
{
  "safe": true/false,
  "severity": "None/Minor/Moderate/Major/Contraindicated",
  "interactions": [{"drugs": ["drug1","drug2"], "effect": "description", "severity": "Minor/Moderate/Major"}],
  "recommendation": "brief clinical recommendation",
  "disclaimer": "Always consult a pharmacist or doctor"
}"""},
                    {"role": "user", "content": f"Check interactions between: {medicines_list}"}
                ],
                temperature=0.2,
                max_tokens=600
            )
            import json, re
            content = response.choices[0].message.content.strip()
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception:
            pass

    return {
        "safe": None,
        "severity": "Unknown",
        "interactions": [],
        "recommendation": "Could not analyze. Please consult your pharmacist.",
        "disclaimer": "Always consult a qualified pharmacist or doctor before taking multiple medications."
    }


@router.post("/mental-assessment", summary="Save mental health assessment")
async def save_assessment(data: AssessmentResult, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "patient_id": current_user["id"],
        "assessment_type": data.assessment_type,
        "score": data.score,
        "level": data.level,
        "answers": data.answers,
        "created_at": datetime.utcnow()
    }
    result = await db.mental_assessments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/mental-assessment/history", summary="Get assessment history")
async def get_assessment_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.mental_assessments.find({"patient_id": current_user["id"]}).sort("created_at", -1).limit(10)
    return [serialize_doc(d) async for d in cursor]
