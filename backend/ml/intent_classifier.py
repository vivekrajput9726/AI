"""
Synora Health — DistilBERT Intent Classifier Inference
Loads the fine-tuned model and classifies user query intent.
"""

import os
from typing import Optional
from loguru import logger

_MODEL_DIR   = os.path.join(os.path.dirname(__file__), "models", "intent_classifier")
_model_cache = None
_tokenizer_cache = None

INTENT_LABELS = [
    "emergency",
    "symptom_query",
    "medication_query",
    "report_query",
    "appointment_query",
    "general_wellness",
]

EMERGENCY_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "unconscious", "stroke",
    "heart attack", "seizure", "overdose", "suicidal", "kill myself",
    "severe bleeding", "not breathing", "choking", "anaphylaxis",
]


def _load_model():
    global _model_cache, _tokenizer_cache
    if _model_cache is not None:
        return _model_cache, _tokenizer_cache
    if not os.path.isdir(_MODEL_DIR):
        return None, None
    try:
        from transformers import (
            DistilBertForSequenceClassification,
            DistilBertTokenizerFast,
        )
        _tokenizer_cache = DistilBertTokenizerFast.from_pretrained(_MODEL_DIR)
        _model_cache     = DistilBertForSequenceClassification.from_pretrained(_MODEL_DIR)
        _model_cache.eval()
        logger.info("DistilBERT intent classifier loaded from disk.")
    except Exception as e:
        logger.warning(f"Failed to load intent classifier: {e}")
        _model_cache = None
        _tokenizer_cache = None
    return _model_cache, _tokenizer_cache


def _rule_based_intent(text: str) -> Optional[str]:
    """Fast keyword-based fallback for emergency detection."""
    lower = text.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in lower:
            return "emergency"
    return None


def classify(text: str) -> dict:
    """
    Classify the intent of a healthcare query.

    Returns:
        dict with keys: intent, confidence, all_scores, source
    """
    # Always check emergency keywords first (safety net)
    rule_intent = _rule_based_intent(text)
    if rule_intent == "emergency":
        return {
            "intent":     "emergency",
            "confidence": 99.0,
            "all_scores": {label: 0.0 for label in INTENT_LABELS},
            "source":     "rule_based",
        }

    model, tokenizer = _load_model()
    if model is None or tokenizer is None:
        return {
            "intent":     "symptom_query",
            "confidence": 0.0,
            "all_scores": {},
            "source":     "unavailable",
        }

    try:
        import torch
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128,
        )
        with torch.no_grad():
            logits = model(**inputs).logits
            probs  = torch.softmax(logits, dim=-1)[0]

        scores = {INTENT_LABELS[i]: round(float(probs[i]) * 100, 2) for i in range(len(INTENT_LABELS))}
        best_idx = int(probs.argmax())
        return {
            "intent":     INTENT_LABELS[best_idx],
            "confidence": round(float(probs[best_idx]) * 100, 2),
            "all_scores": scores,
            "source":     "distilbert",
        }
    except Exception as e:
        logger.warning(f"Intent classifier inference failed: {e}")
        return {
            "intent":     "symptom_query",
            "confidence": 0.0,
            "all_scores": {},
            "source":     "error",
        }


def is_emergency(text: str) -> bool:
    result = classify(text)
    return result["intent"] == "emergency"


def is_model_available() -> bool:
    model, _ = _load_model()
    return model is not None
