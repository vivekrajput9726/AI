"""
Synora Health — Symptom Classifier Inference
Loads the trained Random Forest model and provides predictions.
"""

import os
import pickle
from typing import Optional
from loguru import logger

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "symptom_classifier.pkl")
_model_cache = None


def _load_model():
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    if not os.path.exists(_MODEL_PATH):
        return None
    try:
        with open(_MODEL_PATH, "rb") as f:
            _model_cache = pickle.load(f)
        logger.info("Symptom classifier model loaded from disk.")
    except Exception as e:
        logger.warning(f"Failed to load symptom classifier: {e}")
        _model_cache = None
    return _model_cache


def predict(symptom_text: str, age_group: Optional[str] = None) -> Optional[dict]:
    """
    Predict specialist and severity from symptom text.

    Args:
        symptom_text: Free-text description of symptoms.
        age_group: 'child' | 'young_adult' | 'middle_aged' | 'elderly'

    Returns:
        dict with specialist, severity, and confidence scores — or None if model unavailable.
    """
    import pandas as pd

    model_data = _load_model()
    if model_data is None:
        return None

    if age_group is None:
        age_group = "young_adult"

    try:
        df = pd.DataFrame({"text": [symptom_text], "age_group": [age_group]})
        pipeline    = model_data["pipeline"]
        le_spec     = model_data["le_specialist"]
        le_sev      = model_data["le_severity"]

        pred = pipeline.predict(df)[0]
        specialist = le_spec.inverse_transform([pred[0]])[0]
        severity   = le_sev.inverse_transform([pred[1]])[0]

        # Get probability estimates
        proba = pipeline.predict_proba(df)
        spec_proba = proba[0][0].max()
        sev_proba  = proba[1][0].max()

        return {
            "specialist":          specialist,
            "severity":            severity,
            "specialist_confidence": round(float(spec_proba) * 100, 1),
            "severity_confidence":   round(float(sev_proba)  * 100, 1),
            "model":               "RandomForest-TF-IDF",
            "model_metrics": {
                "specialist_accuracy": model_data["metrics"]["specialist_accuracy"],
                "severity_accuracy":   model_data["metrics"]["severity_accuracy"],
            }
        }
    except Exception as e:
        logger.warning(f"Symptom classifier prediction failed: {e}")
        return None


def age_to_group(age: Optional[int]) -> str:
    """Convert numeric age to age_group string for the classifier."""
    if age is None:
        return "young_adult"
    if age < 15:
        return "child"
    if age <= 35:
        return "young_adult"
    if age <= 59:
        return "middle_aged"
    return "elderly"


def is_model_available() -> bool:
    return _load_model() is not None
