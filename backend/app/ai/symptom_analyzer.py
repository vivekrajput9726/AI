import asyncio
import json
import re
from typing import List, Optional
from loguru import logger
from app.config.settings import settings

# Local trained models (loaded lazily so server starts even before training)
try:
    from ml.symptom_classifier import predict as ml_predict_symptoms, age_to_group
    from ml.intent_classifier import classify as ml_classify_intent, is_emergency as ml_is_emergency
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


SYSTEM_PROMPT = """You are an expert medical AI assistant integrated into a healthcare platform.
Your role is to analyze patient symptoms and provide helpful health information.

IMPORTANT RULES:
1. Always include the disclaimer: "This is not a medical diagnosis. Please consult a qualified doctor."
2. Never make definitive diagnoses - only suggest possible conditions
3. For emergencies (chest pain, difficulty breathing, stroke symptoms, severe bleeding), always set emergency_warning to true
4. Be empathetic and professional
5. Recommend appropriate specialist types based on symptoms
6. Include SHAP-style explainability: for each symptom, assign an importance score (0-100) showing how much it contributed to the top diagnosis

=====================================
AGE-BASED ANALYSIS — MANDATORY RULES
Apply these BEFORE anything else. They override general severity defaults.
=====================================

CHILD (Age < 15) — STRICT RULES:
- specialist_type MUST be "Pediatrician" — no exceptions, regardless of the symptom
- severity_level MUST be at least "Moderate" — NEVER return "Mild" for a child patient
  Rationale: Children have immature immune systems, cannot accurately self-report pain, and minor-seeming symptoms can escalate rapidly
- Prioritize pediatric-specific conditions: RSV, croup, febrile seizures, strep throat, ear infections, Kawasaki disease, intussusception, childhood asthma, rotavirus
- Any red-flag symptom in a child (fever >102°F, rash + fever, difficulty breathing, unusual lethargy, refusal to eat) → severity = "Emergency", emergency_warning = true
- risk_factors must include: "Developing/immature immune system", "Rapid symptom escalation risk in children", "Cannot accurately self-report pain level"
- brief_assessment must explicitly mention the child's age and recommend seeing a Pediatrician promptly

ELDERLY (Age 60+) — STRICT RULES:
- Escalate severity by at least ONE level compared to a younger adult with identical symptoms:
    Mild → Moderate | Moderate → Severe | Severe → Emergency
- Chest pain, dizziness, confusion, shortness of breath, or sudden weakness at age 60+ → ALWAYS Emergency, emergency_warning = true
- Assume high probability of comorbidities: hypertension, diabetes, COPD, cardiac disease, reduced kidney/liver function
- Always add "Advanced age (60+)" as the FIRST entry in risk_factors
- risk_factors must also include: "Likely comorbidities", "Polypharmacy interaction risk", "Reduced physiological reserve"
- Recommend the primary specialist AND suggest geriatric evaluation for overall health review
- brief_assessment must clearly state that at their age this situation warrants prompt medical attention

ALL OTHER AGES (15–59):
- Age 15–18: Consider adolescent/growth-related issues, mental health, sports injuries, eating disorders
- Age 19–35: Infections, anxiety, IBS, migraines common; low cardiac risk unless symptoms are severe
- Age 36–59: Increase suspicion for hypertension, diabetes, thyroid issues, metabolic syndrome; elevate severity accordingly

Always cross-reference the patient's age with the reported symptoms to adjust:
  a) Probability scores of each condition
  b) Severity level (child or elderly rules above take priority)
  c) Specialist recommendation (Pediatrician mandatory for age < 15)
  d) Risk factors listed

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


_SEVERITY_ORDER = ["Mild", "Moderate", "Severe", "Emergency"]


def _escalate_severity(level: str) -> str:
    """Bump severity up one step (capped at Emergency)."""
    idx = _SEVERITY_ORDER.index(level) if level in _SEVERITY_ORDER else 0
    return _SEVERITY_ORDER[min(idx + 1, len(_SEVERITY_ORDER) - 1)]


def rule_based_analysis(symptoms_text: str, patient_age: Optional[int] = None) -> dict:
    """Fallback rule-based analysis when AI APIs are not available."""
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

    severity = matched["severity"]
    specialist = matched["specialist"]
    risk_factors = ["Environmental factors", "Lifestyle factors"]
    age_note = ""

    # --- Child logic (age < 15) ---
    if patient_age is not None and patient_age < 15:
        specialist = "Pediatrician"
        # Minimum severity for children is Moderate
        if severity == "Mild":
            severity = "Moderate"
        risk_factors = [
            "Developing/immature immune system",
            "Rapid symptom escalation risk in children",
            "Cannot accurately self-report pain level"
        ] + risk_factors
        age_note = f" As your child is {patient_age} years old, it is important to consult a Pediatrician promptly — children's symptoms can worsen quickly."

    # --- Elderly logic (age >= 60) ---
    elif patient_age is not None and patient_age >= 60:
        severity = _escalate_severity(severity)
        risk_factors = [
            f"Advanced age ({patient_age}+)",
            "Likely comorbidities (hypertension, diabetes, cardiac disease)",
            "Polypharmacy interaction risk",
            "Reduced physiological reserve"
        ] + risk_factors
        age_note = f" At age {patient_age}, even seemingly moderate symptoms can indicate a serious underlying condition — please seek medical attention promptly."

    emergency = severity == "Emergency" or any(
        word in symptoms_lower for word in ["chest pain", "can't breathe", "unconscious", "stroke", "severe bleeding"]
    )
    if emergency:
        severity = "Emergency"

    precautions = [
        "Rest and stay hydrated",
        "Monitor your temperature regularly",
        "Avoid self-medication without doctor's advice",
        "Seek immediate care if symptoms worsen",
        "Maintain a healthy diet and sleep schedule"
    ]

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
        "severity_level": severity,
        "specialist_type": specialist,
        "precautions": precautions,
        "emergency_warning": emergency,
        "brief_assessment": (
            f"Based on your symptoms, you may be experiencing {matched['conditions'][0]['name']}. "
            f"A {specialist} would be best suited to evaluate your condition.{age_note} "
            "Please consult a healthcare professional for proper diagnosis."
        ),
        "shap_insights": shap_insights,
        "risk_factors": risk_factors,
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

    # Age goes first — it is the highest-priority context for accurate diagnosis
    if patient_age is not None:
        if patient_age < 15:
            age_group = f"CHILD ({patient_age} years)"
            age_directive = (
                "MANDATORY: specialist_type = 'Pediatrician'. "
                "severity_level must be at least 'Moderate' (never 'Mild'). "
                "Flag child-specific risk factors. "
                "Mention the child's age in brief_assessment and advise prompt Pediatrician visit."
            )
        elif patient_age >= 60:
            age_group = f"ELDERLY ({patient_age} years)"
            age_directive = (
                "MANDATORY: escalate severity by one level vs a younger adult with the same symptoms. "
                "Chest pain / dizziness / confusion / breathlessness = Emergency. "
                "List 'Advanced age' as first risk_factor. "
                "Recommend primary specialist + geriatric review. "
                "brief_assessment must stress urgency of prompt medical attention at this age."
            )
        else:
            age_group = (
                "Teenager (13–18)"    if patient_age <= 18 else
                "Young Adult (19–35)" if patient_age <= 35 else
                "Middle-aged (36–59)"
            )
            age_directive = "Adjust condition probabilities and severity for this age group."

        patient_context = (
            f"⚠ PATIENT AGE: {patient_age} years [{age_group}]\n"
            f"AGE RULE: {age_directive}\n"
        )
    else:
        patient_context = ""

    patient_context += f"Patient symptoms: {symptoms}"
    if patient_gender:
        patient_context += f"\nPatient gender: {patient_gender}"
    if duration:
        patient_context += f"\nDuration: {duration}"
    if severity:
        patient_context += f"\nSelf-reported severity: {severity}"
    if report_context:
        patient_context += f"\n\nPatient has also uploaded a medical report. Use this data to refine your analysis:\n{report_context}"

    # ── Run our trained ML model first to pre-classify symptoms ──────────────
    ml_hint = ""
    ml_prediction = None
    if ML_AVAILABLE:
        try:
            age_group = age_to_group(patient_age)
            ml_prediction = ml_predict_symptoms(symptoms, age_group)
            if ml_prediction:
                ml_hint = (
                    f"\n\n⚙ SYNORA ML PRE-CLASSIFICATION (trained Random Forest model):\n"
                    f"  Predicted Specialist : {ml_prediction['specialist']} "
                    f"(confidence {ml_prediction['specialist_confidence']}%)\n"
                    f"  Predicted Severity   : {ml_prediction['severity']} "
                    f"(confidence {ml_prediction['severity_confidence']}%)\n"
                    f"Use these as strong priors. Override only if clinical evidence clearly suggests otherwise."
                )
                patient_context += ml_hint
                logger.info(
                    f"ML pre-classification: specialist={ml_prediction['specialist']}, "
                    f"severity={ml_prediction['severity']}"
                )
        except Exception as e:
            logger.warning(f"ML symptom classifier skipped: {e}")

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
                result = json.loads(json_match.group())
                if ml_prediction:
                    result["ml_pre_classification"] = ml_prediction
                return result
        except Exception as e:
            logger.warning(f"Groq analysis failed: {e}")

    # Try Gemini
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash-lite")
            prompt = SYSTEM_PROMPT + "\n\nPatient information:\n" + patient_context
            response = model.generate_content(prompt)
            content = response.text.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                if ml_prediction:
                    result["ml_pre_classification"] = ml_prediction
                return result
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
                result = json.loads(json_match.group())
                if ml_prediction:
                    result["ml_pre_classification"] = ml_prediction
                return result
        except Exception as e:
            logger.warning(f"OpenAI analysis failed: {e}")

    result = rule_based_analysis(symptoms, patient_age)
    if ml_prediction:
        result["ml_pre_classification"] = ml_prediction
    return result


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
    if patient_age is not None:
        patient_info += f"Patient age: {patient_age} years\n"
        if patient_age < 15:
            patient_info += (
                f"AGE CONTEXT: This is a CHILD ({patient_age} years old). "
                "Always recommend a Pediatrician. Treat symptoms as at least Moderate in seriousness. "
                "Be extra gentle and reassuring — speak to the parent/guardian. "
                "Emphasise that children need specialist paediatric care.\n"
            )
        elif patient_age >= 60:
            patient_info += (
                f"AGE CONTEXT: This is an ELDERLY patient ({patient_age} years old). "
                "Treat all symptoms with elevated concern — what is mild at 30 can be serious at 60+. "
                "Highlight the need for prompt medical attention. "
                "Mention possible comorbidities and the importance of not delaying care.\n"
            )
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

    # ── Intent classification with our fine-tuned DistilBERT model ───────────
    intent_result = None
    if ML_AVAILABLE:
        try:
            intent_result = ml_classify_intent(message)
            logger.info(
                f"Intent classified: {intent_result['intent']} "
                f"(confidence {intent_result['confidence']}%, source={intent_result['source']})"
            )
            # If emergency is detected, prepend a strong warning to the system prompt
            if intent_result["intent"] == "emergency":
                system = (
                    "⚠ EMERGENCY ALERT — Our trained intent classifier has detected this as an EMERGENCY query.\n"
                    "Respond IMMEDIATELY with emergency guidance. Tell the user to call emergency services NOW.\n"
                    "Do NOT give a general health answer. Life may be at risk.\n\n"
                ) + system
        except Exception as e:
            logger.warning(f"Intent classifier skipped: {e}")

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
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash-lite")
            full_prompt = system + "\n\n" + "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages[1:]])
            response = model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini chat failed: {e}")

    return _local_chat_fallback(message, patient_name, patient_age, report_context)


def _local_chat_fallback(
    message: str,
    patient_name: Optional[str] = None,
    patient_age: Optional[int] = None,
    report_context: Optional[str] = None,
) -> str:
    """Rule-based fallback when all AI providers are unavailable."""
    name = patient_name or "there"
    msg = message.lower()

    # Greetings
    if any(w in msg for w in ["hello", "hi ", "hey", "namaste", "good morning", "good evening", "good afternoon"]):
        return f"Hello {name}! I'm Synora AI, your health assistant. How can I help you today? You can ask me about symptoms, medicines, diet tips, or your lab reports."

    # Serious / emergency keywords
    emergency_words = ["chest pain", "heart attack", "can't breathe", "cannot breathe", "stroke", "unconscious", "fainted", "severe bleeding", "overdose", "suicide"]
    if any(w in msg for w in emergency_words):
        return f"⚠️ **This sounds like a medical emergency, {name}.** Please **call 112 (India emergency)** or go to the nearest hospital immediately. Do not wait — emergencies need immediate in-person care."

    # Fever
    if any(w in msg for w in ["fever", "temperature", "bukhar"]):
        age_note = " For children, even a mild fever should be monitored closely." if patient_age and patient_age < 15 else (" For elderly patients, fever can escalate quickly — don't delay." if patient_age and patient_age >= 60 else "")
        return (
            f"Fever can be caused by infections (viral or bacterial), inflammation, or heat exhaustion, {name}.\n\n"
            "• **Mild fever (99–100.4°F / 37.2–38°C):** Rest, drink fluids, try paracetamol (500 mg for adults).\n"
            "• **High fever (above 103°F / 39.4°C):** See a doctor promptly.\n"
            "• **With rash, stiff neck, or severe headache:** Go to a doctor immediately — could be dengue or meningitis.\n\n"
            f"{age_note} Use the **AI Symptom Checker** on this platform for a more detailed analysis."
        )

    # Headache
    if any(w in msg for w in ["headache", "head pain", "migraine", "sir dard"]):
        return (
            f"Headaches are very common, {name}, and usually not serious.\n\n"
            "• **Tension headache:** Stress, dehydration, or eye strain — rest, hydrate, take paracetamol.\n"
            "• **Migraine:** Throbbing pain, nausea, light sensitivity — rest in a dark quiet room.\n"
            "• **Sudden severe headache (worst of your life):** See a doctor immediately.\n\n"
            "If headaches are frequent or worsening, consult a **neurologist**."
        )

    # Cold / cough
    if any(w in msg for w in ["cold", "cough", "runny nose", "sore throat", "sneezing", "khasi", "zukam"]):
        return (
            f"Sounds like a common cold or upper respiratory infection, {name}.\n\n"
            "• Stay warm, rest, and drink warm fluids (ginger tea, turmeric milk).\n"
            "• Steam inhalation can relieve congestion.\n"
            "• **Cough with fever > 3 days or breathing difficulty:** See a doctor — could be flu or pneumonia.\n\n"
            "Over-the-counter options: cetirizine for runny nose, cough syrup for dry cough. Always check with a pharmacist."
        )

    # Stomach / digestion
    if any(w in msg for w in ["stomach", "abdomen", "nausea", "vomit", "diarrhea", "loose motion", "constipation", "acidity", "gas", "bloating", "pet dard"]):
        return (
            f"Digestive issues are very common, {name}.\n\n"
            "• **Acidity/gas:** Avoid spicy/oily food, eat smaller meals, try antacids (Gelusil or Digene).\n"
            "• **Diarrhea:** Stay well hydrated — ORS (oral rehydration salts) is very important.\n"
            "• **Vomiting + diarrhea for > 24 hours:** See a doctor to prevent dehydration.\n"
            "• **Severe abdominal pain (especially right side):** Could be appendicitis — go to hospital.\n\n"
            "Consult a **gastroenterologist** if symptoms are recurring."
        )

    # Diabetes / blood sugar
    if any(w in msg for w in ["diabetes", "blood sugar", "sugar level", "insulin", "hba1c", "glucose"]):
        return (
            f"Managing diabetes well is very achievable, {name}.\n\n"
            "• **Normal fasting sugar:** 70–100 mg/dL. **Pre-diabetic:** 100–125. **Diabetic:** 126+.\n"
            "• Key tips: Low-GI diet (less white rice/bread), 30 min daily walk, regular medication.\n"
            "• **HbA1c below 7%** is the general target for diabetics.\n\n"
            "Upload your lab report using the **Lab Reports** feature for a personalised AI analysis."
        )

    # Blood pressure
    if any(w in msg for w in ["blood pressure", "bp", "hypertension", "bp high", "bp low"]):
        return (
            f"Blood pressure management is important, {name}.\n\n"
            "• **Normal BP:** 120/80 mmHg. **High (hypertension):** 140/90+. **Low:** below 90/60.\n"
            "• High BP: reduce salt, avoid stress, exercise regularly, take prescribed medicines consistently.\n"
            "• Low BP: stay hydrated, eat small frequent meals, avoid standing up suddenly.\n\n"
            "Monitor your BP regularly and consult a **cardiologist** if readings are consistently high."
        )

    # Sleep
    if any(w in msg for w in ["sleep", "insomnia", "can't sleep", "neend nahi"]):
        return (
            f"Sleep issues are increasingly common, {name}.\n\n"
            "• Maintain a fixed sleep schedule — sleep and wake at the same time daily.\n"
            "• Avoid screens (phone/TV) at least 30 minutes before bed.\n"
            "• Avoid caffeine after 4 PM. Try warm milk or chamomile tea at night.\n"
            "• Chronic insomnia may signal anxiety or depression — consult a **psychiatrist or sleep specialist**.\n\n"
            "Track your sleep with the **Health Goals** feature on this platform."
        )

    # Anxiety / stress / mental health
    if any(w in msg for w in ["anxiety", "stress", "depression", "mental", "panic", "worried", "sad", "crying"]):
        return (
            f"I hear you, {name} — mental health is just as important as physical health.\n\n"
            "• Breathing exercises (4-7-8 breathing) can help calm anxiety quickly.\n"
            "• Regular exercise, good sleep, and social connection make a big difference.\n"
            "• **Persistent sadness or anxiety lasting > 2 weeks:** Please consult a **psychiatrist or counsellor** — there is no shame in asking for help.\n\n"
            "You're not alone. Seeking support is a sign of strength."
        )

    # Medicine / dosage
    if any(w in msg for w in ["medicine", "tablet", "capsule", "dosage", "dose", "drug", "paracetamol", "ibuprofen", "antibiotic"]):
        return (
            f"Happy to help with medicine information, {name}.\n\n"
            "• **Paracetamol (500 mg):** Safe for fever/pain — max 4 doses/day, avoid with alcohol.\n"
            "• **Ibuprofen:** Good for inflammation/pain — take after food, avoid with kidney issues.\n"
            "• **Antibiotics:** Always complete the full course even if you feel better — never self-prescribe.\n\n"
            "For specific medicine queries, always verify with a **pharmacist or doctor**. I can give general guidance but prescriptions require professional advice."
        )

    # Diet / food / nutrition
    if any(w in msg for w in ["diet", "food", "eat", "nutrition", "weight", "obese", "lose weight", "calories"]):
        return (
            f"Good nutrition is the foundation of good health, {name}.\n\n"
            "• Eat plenty of vegetables, whole grains (brown rice, roti), pulses, and fruits.\n"
            "• Limit sugar, processed foods, fried snacks, and excess salt.\n"
            "• Drink **8–10 glasses of water** daily.\n"
            "• For weight loss: aim for 500 calorie deficit/day through diet + exercise — safe rate is 0.5 kg/week.\n\n"
            "Use the **Health Goals** feature to track your weight and progress."
        )

    # Lab reports
    if any(w in msg for w in ["report", "lab", "blood test", "test result", "cbc", "hemoglobin", "thyroid", "cholesterol"]):
        if report_context:
            return (
                f"I can see your report data, {name}. Here's a quick overview:\n\n"
                "• Values outside normal range are worth discussing with your doctor.\n"
                "• Use the **Lab Reports** section to upload your full report for a detailed AI analysis.\n\n"
                "For personalised interpretation, consult your doctor with the printed report."
            )
        return (
            f"To analyse your lab report, {name}, please upload it using the **Lab Reports** feature on this platform. "
            "Our AI can interpret blood counts (CBC), sugar, thyroid (TSH/T3/T4), cholesterol, liver/kidney function, and more."
        )

    # How serious / severity
    if any(w in msg for w in ["how serious", "serious", "dangerous", "should i worry", "is it bad"]):
        return (
            f"That's an important question, {name}. Seriousness depends on several factors:\n\n"
            "• **Duration:** Symptoms lasting more than a week without improvement need medical attention.\n"
            "• **Severity:** Severe pain, high fever (>103°F), or difficulty breathing always warrants a doctor visit.\n"
            "• **Age:** Children and elderly patients need earlier medical evaluation.\n\n"
            "Use the **AI Symptom Checker** on this platform to get a more specific severity assessment based on your symptoms."
        )

    # Home remedies
    if any(w in msg for w in ["home remedy", "home remedies", "gharelu", "natural remedy", "ayurvedic"]):
        return (
            f"Here are some well-known home remedies used in Indian households, {name}:\n\n"
            "• **Ginger + honey + lemon:** Great for cold, cough, and sore throat.\n"
            "• **Turmeric milk (haldi doodh):** Anti-inflammatory, helps with minor infections.\n"
            "• **Ajwain (carom seeds) with warm water:** Relieves acidity and bloating.\n"
            "• **Tulsi leaves:** Boosts immunity, helps with fever and respiratory issues.\n\n"
            "Home remedies support recovery but should not replace medical treatment for serious conditions."
        )

    # Doctor / appointment
    if any(w in msg for w in ["doctor", "appointment", "specialist", "consult", "hospital"]):
        return (
            f"Seeing the right doctor makes all the difference, {name}.\n\n"
            "• Use the **Book Appointment** feature on this platform to find and book with specialist doctors.\n"
            "• Use **Nearby Hospitals** to find clinics and hospitals close to you.\n\n"
            "Common specialists: **General Physician** for routine issues, **Cardiologist** for heart, **Orthopedist** for bones/joints, **Dermatologist** for skin, **Gynecologist** for women's health."
        )

    # Default helpful response
    return (
        f"Thanks for your question, {name}. I'm Synora AI and I'm here to help with health queries.\n\n"
        "You can ask me about:\n"
        "• **Symptoms** — possible causes and when to see a doctor\n"
        "• **Medicines** — dosage, side effects, and interactions\n"
        "• **Diet & nutrition** — for specific conditions\n"
        "• **Lab reports** — upload yours for AI analysis\n"
        "• **Mental health** — stress, anxiety, sleep issues\n\n"
        "For a detailed symptom analysis, try the **AI Symptom Checker** on this platform."
    )
