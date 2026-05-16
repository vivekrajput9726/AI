from pydantic import BaseModel
from typing import Optional, List


class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[str] = None
    report_context: Optional[str] = None  # JSON string of pre-analyzed report data
    analysis_id: Optional[str] = None     # If provided, update existing record instead of insert


class DoctorRecommendation(BaseModel):
    id: str
    name: str
    specialization: str
    rating: float
    experience_years: int
    consultation_fee: float
    profile_image: str
    hospital: str
    match_reason: str


class SymptomAnalysisResponse(BaseModel):
    possible_conditions: List[dict]
    severity_level: str
    specialist_type: str
    recommended_doctors: List[DoctorRecommendation]
    precautions: List[str]
    emergency_warning: bool
    disclaimer: str = "This is not a medical diagnosis. Please consult a doctor."
    analysis_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_name: Optional[str] = None
    report_context: Optional[str] = None


class ReportTextAnalysisRequest(BaseModel):
    description: str  # User-described report content
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
