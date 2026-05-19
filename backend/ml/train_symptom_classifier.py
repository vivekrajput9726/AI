"""
Synora Health — Symptom Classifier Training Script
====================================================
Trains a multi-output Random Forest classifier on medical symptom data.

Outputs:
  - models/symptom_classifier.pkl  (trained pipeline)
  - models/training_report.txt     (accuracy + classification report)
  - models/confusion_matrix_specialist.png
  - models/confusion_matrix_severity.png
  - models/feature_importance.png

Run:
    python -m ml.train_symptom_classifier
"""

import os
import json
import pickle
import numpy as np
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.symptoms_dataset import get_dataset

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTS_ENABLED = True
except ImportError:
    PLOTS_ENABLED = False
    print("[WARNING] matplotlib/seaborn not installed — skipping plots.")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ──────────────────────────────────────────────────────────────────────────────
# 1. Load & prepare data
# ──────────────────────────────────────────────────────────────────────────────

def load_data():
    data = get_dataset()
    texts      = [d["text"]       for d in data]
    age_groups = [d["age_group"]  for d in data]
    specialists = [d["specialist"] for d in data]
    severities  = [d["severity"]   for d in data]
    return texts, age_groups, specialists, severities


def build_features(texts, age_groups):
    """Combine TF-IDF on symptom text + one-hot on age group."""
    import pandas as pd
    df = pd.DataFrame({"text": texts, "age_group": age_groups})
    return df


# ──────────────────────────────────────────────────────────────────────────────
# 2. Build sklearn pipeline
# ──────────────────────────────────────────────────────────────────────────────

def build_pipeline():
    text_transformer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=3000,
        sublinear_tf=True,
        analyzer="word",
        min_df=1,
    )
    age_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ("tfidf", text_transformer, "text"),
            ("age",   age_transformer,  ["age_group"]),
        ]
    )

    classifier = MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   classifier),
    ])
    return pipeline


# ──────────────────────────────────────────────────────────────────────────────
# 3. Train & evaluate
# ──────────────────────────────────────────────────────────────────────────────

def plot_confusion_matrix(cm, labels, title, filename):
    if not PLOTS_ENABLED:
        return
    fig, ax = plt.subplots(figsize=(max(8, len(labels)), max(6, len(labels) - 2)))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=labels, yticklabels=labels, ax=ax
    )
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title(title, fontsize=14, fontweight="bold")
    plt.xticks(rotation=45, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, filename)
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {path}")


def plot_feature_importance(pipeline, top_n=30):
    if not PLOTS_ENABLED:
        return
    try:
        rf_spec = pipeline.named_steps["classifier"].estimators_[0]
        rf_sev  = pipeline.named_steps["classifier"].estimators_[1]

        tfidf_names = pipeline.named_steps["preprocessor"] \
            .named_transformers_["tfidf"].get_feature_names_out().tolist()
        age_names = pipeline.named_steps["preprocessor"] \
            .named_transformers_["age"].get_feature_names_out().tolist()
        feature_names = tfidf_names + age_names

        importances = (rf_spec.feature_importances_ + rf_sev.feature_importances_) / 2
        indices = np.argsort(importances)[::-1][:top_n]

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.barh(
            [feature_names[i] for i in reversed(indices)],
            [importances[i] for i in reversed(indices)],
            color="steelblue"
        )
        ax.set_xlabel("Mean Feature Importance", fontsize=12)
        ax.set_title(f"Top {top_n} Most Important Symptom Features", fontsize=14, fontweight="bold")
        plt.tight_layout()
        path = os.path.join(MODELS_DIR, "feature_importance.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"  Saved: {path}")
    except Exception as e:
        print(f"  [WARNING] Feature importance plot failed: {e}")


def train():
    import pandas as pd

    print("\n" + "=" * 60)
    print("  SYNORA HEALTH — SYMPTOM CLASSIFIER TRAINING")
    print("=" * 60)

    # Load
    texts, age_groups, specialists, severities = load_data()
    print(f"\n[1/6] Dataset loaded: {len(texts)} samples")
    print(f"      Specialists : {len(set(specialists))} classes")
    print(f"      Severities  : {len(set(severities))} classes")

    # Encode labels
    le_spec = LabelEncoder()
    le_sev  = LabelEncoder()
    y_spec = le_spec.fit_transform(specialists)
    y_sev  = le_sev.fit_transform(severities)
    y = np.column_stack([y_spec, y_sev])

    # Build feature dataframe
    df = pd.DataFrame({"text": texts, "age_group": age_groups})

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        df, y, test_size=0.2, random_state=42, stratify=y_spec
    )
    print(f"\n[2/6] Train/test split: {len(X_train)} train / {len(X_test)} test")

    # Build & train
    print("\n[3/6] Training Random Forest classifier (n_estimators=300) ...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    print("      Training complete.")

    # Predict
    y_pred = pipeline.predict(X_test)
    y_pred_spec = y_pred[:, 0]
    y_pred_sev  = y_pred[:, 1]
    y_true_spec = y_test[:, 0]
    y_true_sev  = y_test[:, 1]

    spec_accuracy = accuracy_score(y_true_spec, y_pred_spec)
    sev_accuracy  = accuracy_score(y_true_sev,  y_pred_sev)
    spec_f1 = f1_score(y_true_spec, y_pred_spec, average="weighted")
    sev_f1  = f1_score(y_true_sev,  y_pred_sev,  average="weighted")

    print(f"\n[4/6] Evaluation Results:")
    print(f"  {'Metric':<30} {'Specialist':>12}  {'Severity':>10}")
    print(f"  {'-'*55}")
    print(f"  {'Accuracy':<30} {spec_accuracy*100:>11.1f}%  {sev_accuracy*100:>9.1f}%")
    print(f"  {'Weighted F1-Score':<30} {spec_f1:>12.3f}  {sev_f1:>10.3f}")

    spec_report = classification_report(
        y_true_spec, y_pred_spec,
        target_names=le_spec.classes_,
        zero_division=0
    )
    sev_report = classification_report(
        y_true_sev, y_pred_sev,
        target_names=le_sev.classes_,
        zero_division=0
    )

    print(f"\n--- Specialist Classification Report ---\n{spec_report}")
    print(f"--- Severity Classification Report ---\n{sev_report}")

    # Confusion matrices
    print("[5/6] Generating visualisations ...")
    cm_spec = confusion_matrix(y_true_spec, y_pred_spec)
    cm_sev  = confusion_matrix(y_true_sev,  y_pred_sev)
    plot_confusion_matrix(cm_spec, le_spec.classes_, "Specialist Prediction — Confusion Matrix", "confusion_matrix_specialist.png")
    plot_confusion_matrix(cm_sev,  le_sev.classes_,  "Severity Prediction — Confusion Matrix",   "confusion_matrix_severity.png")
    plot_feature_importance(pipeline)

    # Save model + encoders
    print("\n[6/6] Saving model artifacts ...")
    model_data = {
        "pipeline":    pipeline,
        "le_specialist": le_spec,
        "le_severity":   le_sev,
        "specialist_classes": le_spec.classes_.tolist(),
        "severity_classes":   le_sev.classes_.tolist(),
        "metrics": {
            "specialist_accuracy": round(spec_accuracy, 4),
            "severity_accuracy":   round(sev_accuracy, 4),
            "specialist_f1":       round(spec_f1, 4),
            "severity_f1":         round(sev_f1, 4),
            "train_samples":       len(X_train),
            "test_samples":        len(X_test),
        }
    }
    pkl_path = os.path.join(MODELS_DIR, "symptom_classifier.pkl")
    with open(pkl_path, "wb") as f:
        pickle.dump(model_data, f)
    print(f"  Model saved: {pkl_path}")

    # Save text report
    report_path = os.path.join(MODELS_DIR, "training_report.txt")
    with open(report_path, "w") as f:
        f.write("SYNORA HEALTH — SYMPTOM CLASSIFIER TRAINING REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Dataset size : {len(texts)} samples\n")
        f.write(f"Train / Test : {len(X_train)} / {len(X_test)}\n")
        f.write(f"Model        : Random Forest (n_estimators=300, TF-IDF + Age features)\n\n")
        f.write(f"SPECIALIST PREDICTION\n")
        f.write(f"  Accuracy : {spec_accuracy*100:.1f}%\n")
        f.write(f"  F1-Score : {spec_f1:.3f}\n\n")
        f.write(f"SEVERITY PREDICTION\n")
        f.write(f"  Accuracy : {sev_accuracy*100:.1f}%\n")
        f.write(f"  F1-Score : {sev_f1:.3f}\n\n")
        f.write("--- Specialist Classification Report ---\n")
        f.write(spec_report + "\n")
        f.write("--- Severity Classification Report ---\n")
        f.write(sev_report + "\n")
    print(f"  Report saved: {report_path}")

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print(f"  Specialist Accuracy : {spec_accuracy*100:.1f}%")
    print(f"  Severity Accuracy   : {sev_accuracy*100:.1f}%")
    print("=" * 60 + "\n")

    return model_data


if __name__ == "__main__":
    train()
