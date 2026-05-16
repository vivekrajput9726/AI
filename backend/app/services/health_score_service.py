from datetime import date


def _bmi_score(weight_kg: float, height_cm: float) -> tuple[float, float, str]:
    bmi = weight_kg / ((height_cm / 100) ** 2)
    bmi = round(bmi, 1)
    if 18.5 <= bmi <= 24.9:
        score = 100.0
        label = "Normal"
    elif bmi < 18.5:
        score = max(0.0, 100.0 - (18.5 - bmi) * 7)
        label = "Underweight"
    else:
        score = max(0.0, 100.0 - (bmi - 24.9) * 7)
        label = "Overweight" if bmi < 30 else "Obese"
    return bmi, round(score, 1), label


def _bp_score(systolic: int, diastolic: int) -> tuple[str, float, str]:
    sys_score = 100.0
    if systolic < 90:
        sys_score = max(0.0, 100.0 - (90 - systolic) * 2)
    elif systolic > 120:
        sys_score = max(0.0, 100.0 - (systolic - 120) * 2)

    dia_score = 100.0
    if diastolic < 60:
        dia_score = max(0.0, 100.0 - (60 - diastolic) * 2)
    elif diastolic > 80:
        dia_score = max(0.0, 100.0 - (diastolic - 80) * 2)

    score = (sys_score + dia_score) / 2
    value = f"{systolic}/{diastolic}"

    if systolic <= 120 and diastolic <= 80:
        label = "Normal"
    elif systolic <= 129 and diastolic < 80:
        label = "Elevated"
    elif systolic <= 139 or diastolic <= 89:
        label = "High Stage 1"
    else:
        label = "High Stage 2"

    return value, round(score, 1), label


def _sugar_score(sugar: float) -> tuple[float, float, str]:
    if 70.0 <= sugar <= 100.0:
        score = 100.0
        label = "Normal"
    elif sugar < 70.0:
        score = max(0.0, 100.0 - (70.0 - sugar) * 2)
        label = "Low"
    elif sugar <= 125.0:
        score = max(0.0, 100.0 - (sugar - 100.0) * 1.5)
        label = "Pre-diabetic"
    else:
        score = max(0.0, 100.0 - (125.0 - 100.0) * 1.5 - (sugar - 125.0) * 3)
        label = "Diabetic range"
    return sugar, round(score, 1), label


def _hr_score(hr: int) -> tuple[int, float, str]:
    if 60 <= hr <= 100:
        score = 100.0
        label = "Normal"
    elif hr < 60:
        score = max(0.0, 100.0 - (60 - hr) * 2)
        label = "Low"
    else:
        score = max(0.0, 100.0 - (hr - 100) * 2)
        label = "Elevated"
    return hr, round(score, 1), label


def _age_score(dob_str: str | None) -> float:
    if not dob_str:
        return 80.0
    try:
        dob = date.fromisoformat(dob_str)
        age = (date.today() - dob).days // 365
        return max(40.0, 100.0 - (age - 20) * 0.5)
    except Exception:
        return 80.0


def calculate_health_score(user: dict) -> dict:
    weight = user.get("weight_kg")
    height = user.get("height_cm")
    systolic = user.get("blood_pressure_systolic")
    diastolic = user.get("blood_pressure_diastolic")
    sugar = user.get("blood_sugar_mg_dl")
    hr = user.get("heart_rate_bpm")
    dob = user.get("date_of_birth")

    vitals_complete = weight is not None and height is not None

    breakdown = {
        "bmi": {"value": None, "score": None, "label": "Not set"},
        "blood_pressure": {"value": None, "score": None, "label": "Not set"},
        "blood_sugar": {"value": None, "score": None, "label": "Not set"},
        "heart_rate": {"value": None, "score": None, "label": "Not set"},
    }

    metrics: list[tuple[str, float, float]] = []  # (key, sub_score, weight)

    base_weights = {
        "bmi": 0.30,
        "blood_pressure": 0.25,
        "blood_sugar": 0.20,
        "heart_rate": 0.15,
        "age": 0.10,
    }

    present_weights: dict[str, float] = {}

    bmi_value = None
    if weight is not None and height is not None and height > 0:
        bmi_value, bmi_s, bmi_label = _bmi_score(weight, height)
        breakdown["bmi"] = {"value": bmi_value, "score": bmi_s, "label": bmi_label}
        present_weights["bmi"] = base_weights["bmi"]

    if systolic is not None and diastolic is not None:
        bp_val, bp_s, bp_label = _bp_score(systolic, diastolic)
        breakdown["blood_pressure"] = {"value": bp_val, "score": bp_s, "label": bp_label}
        present_weights["blood_pressure"] = base_weights["blood_pressure"]

    if sugar is not None:
        sg_val, sg_s, sg_label = _sugar_score(sugar)
        breakdown["blood_sugar"] = {"value": sg_val, "score": sg_s, "label": sg_label}
        present_weights["blood_sugar"] = base_weights["blood_sugar"]

    if hr is not None:
        hr_val, hr_s, hr_label = _hr_score(hr)
        breakdown["heart_rate"] = {"value": hr_val, "score": hr_s, "label": hr_label}
        present_weights["heart_rate"] = base_weights["heart_rate"]

    age_score = _age_score(dob)
    present_weights["age"] = base_weights["age"]

    total_weight = sum(present_weights.values())
    if total_weight == 0:
        return {
            "score": 0,
            "risk_level": "Unknown",
            "vitals_complete": False,
            "score_breakdown": breakdown,
        }

    weighted_sum = 0.0
    for key, w in present_weights.items():
        if key == "age":
            weighted_sum += age_score * w
        elif key == "bmi":
            weighted_sum += breakdown["bmi"]["score"] * w
        elif key == "blood_pressure":
            weighted_sum += breakdown["blood_pressure"]["score"] * w
        elif key == "blood_sugar":
            weighted_sum += breakdown["blood_sugar"]["score"] * w
        elif key == "heart_rate":
            weighted_sum += breakdown["heart_rate"]["score"] * w

    final_score = round(weighted_sum / total_weight)

    # Risk classification — count flagged metrics
    flags = 0
    if bmi_value is not None and (bmi_value < 17 or bmi_value > 30):
        flags += 1
    if systolic is not None and (systolic > 140 or systolic < 90):
        flags += 1
    if diastolic is not None and diastolic > 90:
        flags += 1
    if sugar is not None and (sugar > 126 or sugar < 60):
        flags += 1
    if hr is not None and (hr > 110 or hr < 50):
        flags += 1

    if flags == 0:
        risk_level = "Low"
    elif flags <= 2:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    return {
        "score": final_score,
        "risk_level": risk_level,
        "vitals_complete": vitals_complete,
        "score_breakdown": breakdown,
    }
