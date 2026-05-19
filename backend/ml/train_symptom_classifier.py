"""
Synora Health — Symptom Classifier Training Script
====================================================
Trains a multi-output LogisticRegression classifier on medical symptom data.
LogisticRegression with TF-IDF significantly outperforms RandomForest on
high-dimensional sparse text features.

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
import pickle
import numpy as np
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.symptoms_dataset import get_dataset

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
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
    texts       = [d["text"]       for d in data]
    age_groups  = [d["age_group"]  for d in data]
    specialists = [d["specialist"] for d in data]
    severities  = [d["severity"]   for d in data]
    return texts, age_groups, specialists, severities


# ──────────────────────────────────────────────────────────────────────────────
# 2. Build sklearn pipeline
# LogisticRegression + TF-IDF (word & char n-grams) + OneHot age
# ──────────────────────────────────────────────────────────────────────────────

def build_pipeline():
    # ColumnTransformer applies both TF-IDF variants + age OneHot in one pass.
    # Specifying the same column ("text") twice is valid in ColumnTransformer.
    preprocessor = ColumnTransformer(
        transformers=[
            # Word n-grams: captures medical terms and multi-word phrases
            ("word_tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=8000,
                sublinear_tf=True,
                analyzer="word",
                min_df=1,
            ), "text"),
            # Char n-grams: catches abbreviations, partial words, and typos
            ("char_tfidf", TfidfVectorizer(
                ngram_range=(3, 5),
                max_features=5000,
                sublinear_tf=True,
                analyzer="char_wb",
                min_df=2,
            ), "text"),
            ("age", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["age_group"]),
        ]
    )

    # LogisticRegression: best accuracy on sparse text features
    # C=2.0 slight regularisation, class_weight handles imbalance
    classifier = MultiOutputClassifier(
        LogisticRegression(
            C=5.0,
            max_iter=3000,
            class_weight="balanced",
            solver="lbfgs",
            random_state=42,
        )
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   classifier),
    ])
    return pipeline


# ──────────────────────────────────────────────────────────────────────────────
# 3. Visualisations
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


def plot_top_words(pipeline, le_spec, top_n=10):
    """Show top TF-IDF word features per specialist class."""
    if not PLOTS_ENABLED:
        return
    try:
        preprocessor  = pipeline.named_steps["preprocessor"]
        word_vec      = preprocessor.named_transformers_["word_tfidf"]
        feature_names = np.array(word_vec.get_feature_names_out().tolist())

        lr        = pipeline.named_steps["classifier"].estimators_[0]
        n_classes = len(lr.classes_)
        cols      = 4
        rows      = (n_classes + cols - 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(20, 4 * rows))
        axes = axes.flatten()
        for i, cls in enumerate(lr.classes_):
            coef    = lr.coef_[i][:len(feature_names)]
            top_idx = np.argsort(coef)[::-1][:top_n]
            axes[i].barh(
                [feature_names[j] for j in reversed(top_idx)],
                [coef[j] for j in reversed(top_idx)],
                color="steelblue"
            )
            axes[i].set_title(le_spec.inverse_transform([cls])[0], fontsize=10)
        for j in range(i + 1, len(axes)):
            axes[j].axis("off")
        plt.suptitle("Top Features per Specialist Class", fontsize=14, fontweight="bold")
        plt.tight_layout()
        path = os.path.join(MODELS_DIR, "feature_importance.png")
        plt.savefig(path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"  Saved: {path}")
    except Exception as e:
        print(f"  [WARNING] Feature plot failed: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# 4. Train & evaluate
# ──────────────────────────────────────────────────────────────────────────────

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

    # Train/test split — stratify on specialist
    X_train, X_test, y_train, y_test = train_test_split(
        df, y, test_size=0.2, random_state=42, stratify=y_spec
    )
    print(f"\n[2/6] Train/test split: {len(X_train)} train / {len(X_test)} test")

    # Build & train
    print("\n[3/6] Training LogisticRegression classifier ...")
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

    # Emergency recall — critical safety metric
    try:
        emergency_idx = list(le_sev.classes_).index("Emergency")
        em_mask = y_true_sev == emergency_idx
        if em_mask.sum() > 0:
            em_recall = (y_pred_sev[em_mask] == emergency_idx).mean()
            print(f"\n  *** SAFETY: Emergency recall = {em_recall*100:.1f}% "
                  f"({em_mask.sum()} emergency cases in test set) ***")
    except ValueError:
        pass

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

    # Cross-validation for reliable macro F1 estimates (avoids single-split variance)
    print("\n  Cross-validation (5-fold) on specialist prediction ...")
    from sklearn.model_selection import StratifiedKFold
    cv_pipeline = build_pipeline()
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_f1_spec, cv_f1_sev = [], []
    for fold_train_idx, fold_test_idx in skf.split(df, y_spec):
        cv_pipeline.fit(df.iloc[fold_train_idx], y[fold_train_idx])
        fold_pred = cv_pipeline.predict(df.iloc[fold_test_idx])
        cv_f1_spec.append(f1_score(y[fold_test_idx, 0], fold_pred[:, 0], average="macro", zero_division=0))
        cv_f1_sev.append( f1_score(y[fold_test_idx, 1], fold_pred[:, 1], average="macro", zero_division=0))
    print(f"  CV Specialist macro F1 : {np.mean(cv_f1_spec):.3f} ± {np.std(cv_f1_spec):.3f}")
    print(f"  CV Severity    macro F1 : {np.mean(cv_f1_sev):.3f} ± {np.std(cv_f1_sev):.3f}")

    # Confusion matrices
    print("[5/6] Generating visualisations ...")
    cm_spec = confusion_matrix(y_true_spec, y_pred_spec)
    cm_sev  = confusion_matrix(y_true_sev,  y_pred_sev)
    plot_confusion_matrix(
        cm_spec, le_spec.classes_,
        "Specialist Prediction — Confusion Matrix",
        "confusion_matrix_specialist.png"
    )
    plot_confusion_matrix(
        cm_sev, le_sev.classes_,
        "Severity Prediction — Confusion Matrix",
        "confusion_matrix_severity.png"
    )
    plot_top_words(pipeline, le_spec)

    # Save model + encoders
    print("\n[6/6] Saving model artifacts ...")
    model_data = {
        "pipeline":           pipeline,
        "le_specialist":      le_spec,
        "le_severity":        le_sev,
        "specialist_classes": le_spec.classes_.tolist(),
        "severity_classes":   le_sev.classes_.tolist(),
        "metrics": {
            "specialist_accuracy": round(spec_accuracy, 4),
            "severity_accuracy":   round(sev_accuracy,  4),
            "specialist_f1":       round(spec_f1, 4),
            "severity_f1":         round(sev_f1,  4),
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
        f.write(f"Model        : LogisticRegression (TF-IDF word+char n-grams + Age)\n\n")
        f.write(f"SPECIALIST PREDICTION\n")
        f.write(f"  Accuracy : {spec_accuracy*100:.1f}%\n")
        f.write(f"  F1-Score : {spec_f1:.3f}\n\n")
        f.write(f"SEVERITY PREDICTION\n")
        f.write(f"  Accuracy : {sev_accuracy*100:.1f}%\n")
        f.write(f"  F1-Score : {sev_f1:.3f}\n\n")
        try:
            if em_mask.sum() > 0:
                f.write(f"SAFETY METRIC\n")
                f.write(f"  Emergency recall : {em_recall*100:.1f}%\n\n")
        except Exception:
            pass
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
