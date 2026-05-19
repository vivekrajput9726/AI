"""
Synora Health — Symptom Classifier Training Script
====================================================
Trains a VotingClassifier ensemble (LogisticRegression + LinearSVC)
on medical symptom data with training-time text augmentation.

Outputs:
  - models/symptom_classifier.pkl
  - models/training_report.txt
  - models/confusion_matrix_specialist.png
  - models/confusion_matrix_severity.png
  - models/feature_importance.png

Run:
    python -m ml.train_symptom_classifier
"""

import os
import pickle
import random
import numpy as np
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.symptoms_dataset import get_dataset

import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import VotingClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
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

RNG_SEED = 42


# ──────────────────────────────────────────────────────────────────────────────
# 1. Load data
# ──────────────────────────────────────────────────────────────────────────────

def load_data():
    data = get_dataset()
    texts       = [d["text"]       for d in data]
    age_groups  = [d["age_group"]  for d in data]
    specialists = [d["specialist"] for d in data]
    severities  = [d["severity"]   for d in data]
    return texts, age_groups, specialists, severities


# ──────────────────────────────────────────────────────────────────────────────
# 2. Text augmentation (training set only)
#    - Word dropout: randomly drop 15-25% of words per sample
#    - Word shuffle: lightly shuffle word order within a sample
#    Creates n_aug extra copies per original sample.
# ──────────────────────────────────────────────────────────────────────────────

def augment_training_data(texts, age_groups, y, n_aug=3, seed=RNG_SEED):
    rng = random.Random(seed)
    aug_texts, aug_age, aug_y = list(texts), list(age_groups), list(y)
    for text, age, label in zip(texts, age_groups, y):
        words = text.split()
        if len(words) < 3:
            continue
        for i in range(n_aug):
            # Dropout: keep each word with probability 0.75-0.90
            keep_prob = rng.uniform(0.75, 0.90)
            kept = [w for w in words if rng.random() < keep_prob]
            if len(kept) < 3:
                kept = words[:]  # fallback: keep all words
            # Light shuffle: swap 1-2 adjacent pairs
            if len(kept) > 3 and rng.random() < 0.4:
                j = rng.randint(0, len(kept) - 2)
                kept[j], kept[j + 1] = kept[j + 1], kept[j]
            aug_texts.append(" ".join(kept))
            aug_age.append(age)
            aug_y.append(label)
    return aug_texts, aug_age, np.array(aug_y)


# ──────────────────────────────────────────────────────────────────────────────
# 3. Build pipeline  —  VotingClassifier (LR + calibrated LinearSVC)
# ──────────────────────────────────────────────────────────────────────────────

def build_pipeline():
    preprocessor = ColumnTransformer(
        transformers=[
            ("word_tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=10000,
                sublinear_tf=True,
                analyzer="word",
                min_df=1,
            ), "text"),
            ("char_tfidf", TfidfVectorizer(
                ngram_range=(3, 5),
                max_features=6000,
                sublinear_tf=True,
                analyzer="char_wb",
                min_df=2,
            ), "text"),
            ("age", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["age_group"]),
        ]
    )

    lr  = LogisticRegression(C=5.0, max_iter=3000, class_weight="balanced",
                             solver="lbfgs", random_state=RNG_SEED)
    svm = CalibratedClassifierCV(
              LinearSVC(C=1.0, max_iter=5000, class_weight="balanced",
                        random_state=RNG_SEED),
              cv=3)
    voting = VotingClassifier(
        estimators=[("lr", lr), ("svm", svm)],
        voting="soft",
    )

    classifier = MultiOutputClassifier(voting)

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   classifier),
    ])


# ──────────────────────────────────────────────────────────────────────────────
# 4. Visualisations
# ──────────────────────────────────────────────────────────────────────────────

def plot_confusion_matrix(cm, labels, title, filename):
    if not PLOTS_ENABLED:
        return
    fig, ax = plt.subplots(figsize=(max(8, len(labels)), max(6, len(labels) - 2)))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=labels, yticklabels=labels, ax=ax)
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


def plot_lr_top_words(pipeline, le_spec, top_n=10):
    if not PLOTS_ENABLED:
        return
    try:
        preprocessor  = pipeline.named_steps["preprocessor"]
        word_vec      = preprocessor.named_transformers_["word_tfidf"]
        feature_names = np.array(word_vec.get_feature_names_out())

        # Extract LR from the VotingClassifier inside MultiOutputClassifier
        mc = pipeline.named_steps["classifier"]
        lr = mc.estimators_[0].estimators_[0]   # specialist LR

        n_classes = len(lr.classes_)
        cols  = 4
        rows  = (n_classes + cols - 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(20, 4 * rows))
        axes = axes.flatten()
        for i, cls in enumerate(lr.classes_):
            coef    = lr.coef_[i][:len(feature_names)]
            top_idx = np.argsort(coef)[::-1][:top_n]
            axes[i].barh(
                [feature_names[j] for j in reversed(top_idx)],
                [coef[j] for j in reversed(top_idx)],
                color="steelblue")
            axes[i].set_title(le_spec.inverse_transform([cls])[0], fontsize=9)
        for j in range(i + 1, len(axes)):
            axes[j].axis("off")
        plt.suptitle("Top Features per Specialist", fontsize=14, fontweight="bold")
        plt.tight_layout()
        path = os.path.join(MODELS_DIR, "feature_importance.png")
        plt.savefig(path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"  Saved: {path}")
    except Exception as e:
        print(f"  [WARNING] Feature plot skipped: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# 5. Train & evaluate
# ──────────────────────────────────────────────────────────────────────────────

def train():
    print("\n" + "=" * 60)
    print("  SYNORA HEALTH — SYMPTOM CLASSIFIER TRAINING")
    print("=" * 60)

    texts, age_groups, specialists, severities = load_data()
    print(f"\n[1/6] Dataset loaded: {len(texts)} samples")
    print(f"      Specialists : {len(set(specialists))} classes")
    print(f"      Severities  : {len(set(severities))} classes")

    le_spec = LabelEncoder()
    le_sev  = LabelEncoder()
    y_spec  = le_spec.fit_transform(specialists)
    y_sev   = le_sev.fit_transform(severities)
    y       = np.column_stack([y_spec, y_sev])

    df = pd.DataFrame({"text": texts, "age_group": age_groups})

    # Train / test split (stratified on specialist)
    X_train_df, X_test_df, y_train, y_test = train_test_split(
        df, y, test_size=0.20, random_state=RNG_SEED, stratify=y_spec
    )
    print(f"\n[2/6] Train/test split: {len(X_train_df)} train / {len(X_test_df)} test")

    # Augment training data only
    print(f"      Augmenting training data (3× word-dropout) ...")
    aug_texts, aug_age, y_train_aug = augment_training_data(
        X_train_df["text"].tolist(),
        X_train_df["age_group"].tolist(),
        y_train,
        n_aug=3,
    )
    X_train_aug = pd.DataFrame({"text": aug_texts, "age_group": aug_age})
    print(f"      Augmented training size: {len(X_train_aug)} samples")

    # Train
    print("\n[3/6] Training VotingClassifier (LR + LinearSVC) ...")
    pipeline = build_pipeline()
    pipeline.fit(X_train_aug, y_train_aug)
    print("      Training complete.")

    # Evaluate on original (non-augmented) test set
    y_pred      = pipeline.predict(X_test_df)
    y_pred_spec = y_pred[:, 0]
    y_pred_sev  = y_pred[:, 1]
    y_true_spec = y_test[:, 0]
    y_true_sev  = y_test[:, 1]

    spec_acc = accuracy_score(y_true_spec, y_pred_spec)
    sev_acc  = accuracy_score(y_true_sev,  y_pred_sev)
    spec_f1  = f1_score(y_true_spec, y_pred_spec, average="weighted")
    sev_f1   = f1_score(y_true_sev,  y_pred_sev,  average="weighted")

    print(f"\n[4/6] Evaluation Results:")
    print(f"  {'Metric':<30} {'Specialist':>12}  {'Severity':>10}")
    print(f"  {'-'*55}")
    print(f"  {'Accuracy':<30} {spec_acc*100:>11.1f}%  {sev_acc*100:>9.1f}%")
    print(f"  {'Weighted F1-Score':<30} {spec_f1:>12.3f}  {sev_f1:>10.3f}")

    # Emergency recall — critical safety metric
    em_recall = None
    try:
        emergency_idx = list(le_sev.classes_).index("Emergency")
        em_mask = y_true_sev == emergency_idx
        if em_mask.sum() > 0:
            em_recall = (y_pred_sev[em_mask] == emergency_idx).mean()
            print(f"\n  *** SAFETY: Emergency recall = {em_recall*100:.1f}% "
                  f"({int(em_mask.sum())} emergency cases in test set) ***")
    except ValueError:
        pass

    spec_report = classification_report(
        y_true_spec, y_pred_spec, target_names=le_spec.classes_, zero_division=0)
    sev_report  = classification_report(
        y_true_sev,  y_pred_sev,  target_names=le_sev.classes_,  zero_division=0)

    print(f"\n--- Specialist Classification Report ---\n{spec_report}")
    print(f"--- Severity Classification Report ---\n{sev_report}")

    # 5-fold CV for stable macro F1 (on original non-augmented data)
    print("  Cross-validation (5-fold, original data) ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RNG_SEED)
    cv_pipeline = build_pipeline()
    cv_spec_f1, cv_sev_f1 = [], []
    for fold_tr, fold_te in skf.split(df, y_spec):
        ft, fa, fy = augment_training_data(
            df.iloc[fold_tr]["text"].tolist(),
            df.iloc[fold_tr]["age_group"].tolist(),
            y[fold_tr], n_aug=3)
        cv_pipeline.fit(pd.DataFrame({"text": ft, "age_group": fa}), np.array(fy))
        fp = cv_pipeline.predict(df.iloc[fold_te])
        cv_spec_f1.append(f1_score(y[fold_te, 0], fp[:, 0], average="macro", zero_division=0))
        cv_sev_f1.append( f1_score(y[fold_te, 1], fp[:, 1], average="macro", zero_division=0))
    print(f"  CV Specialist macro F1 : {np.mean(cv_spec_f1):.3f} ± {np.std(cv_spec_f1):.3f}")
    print(f"  CV Severity    macro F1 : {np.mean(cv_sev_f1):.3f} ± {np.std(cv_sev_f1):.3f}")

    # Plots
    print("\n[5/6] Generating visualisations ...")
    plot_confusion_matrix(
        confusion_matrix(y_true_spec, y_pred_spec), le_spec.classes_,
        "Specialist Prediction — Confusion Matrix", "confusion_matrix_specialist.png")
    plot_confusion_matrix(
        confusion_matrix(y_true_sev, y_pred_sev), le_sev.classes_,
        "Severity Prediction — Confusion Matrix", "confusion_matrix_severity.png")
    plot_lr_top_words(pipeline, le_spec)

    # Save
    print("\n[6/6] Saving model artifacts ...")
    model_data = {
        "pipeline":           pipeline,
        "le_specialist":      le_spec,
        "le_severity":        le_sev,
        "specialist_classes": le_spec.classes_.tolist(),
        "severity_classes":   le_sev.classes_.tolist(),
        "metrics": {
            "specialist_accuracy": round(spec_acc, 4),
            "severity_accuracy":   round(sev_acc,  4),
            "specialist_f1":       round(spec_f1, 4),
            "severity_f1":         round(sev_f1,  4),
            "cv_specialist_f1":    round(float(np.mean(cv_spec_f1)), 4),
            "cv_severity_f1":      round(float(np.mean(cv_sev_f1)), 4),
            "train_samples":       len(X_train_df),
            "test_samples":        len(X_test_df),
            "augmented_train":     len(X_train_aug),
        }
    }
    pkl_path = os.path.join(MODELS_DIR, "symptom_classifier.pkl")
    with open(pkl_path, "wb") as f:
        pickle.dump(model_data, f)
    print(f"  Model saved: {pkl_path}")

    # Text report
    report_path = os.path.join(MODELS_DIR, "training_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("SYNORA HEALTH — SYMPTOM CLASSIFIER TRAINING REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Dataset size     : {len(texts)} samples\n")
        f.write(f"Train / Test     : {len(X_train_df)} / {len(X_test_df)}\n")
        f.write(f"Augmented train  : {len(X_train_aug)}\n")
        f.write(f"Model            : VotingClassifier (LR + LinearSVC) + TF-IDF\n\n")
        f.write(f"SPECIALIST PREDICTION\n")
        f.write(f"  Accuracy       : {spec_acc*100:.1f}%\n")
        f.write(f"  F1-Score       : {spec_f1:.3f}\n")
        f.write(f"  CV macro F1    : {np.mean(cv_spec_f1):.3f} +/- {np.std(cv_spec_f1):.3f}\n\n")
        f.write(f"SEVERITY PREDICTION\n")
        f.write(f"  Accuracy       : {sev_acc*100:.1f}%\n")
        f.write(f"  F1-Score       : {sev_f1:.3f}\n")
        f.write(f"  CV macro F1    : {np.mean(cv_sev_f1):.3f} +/- {np.std(cv_sev_f1):.3f}\n\n")
        if em_recall is not None:
            f.write(f"SAFETY METRIC\n")
            f.write(f"  Emergency recall : {em_recall*100:.1f}%\n\n")
        f.write("--- Specialist Classification Report ---\n")
        f.write(spec_report + "\n")
        f.write("--- Severity Classification Report ---\n")
        f.write(sev_report + "\n")
    print(f"  Report saved: {report_path}")

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print(f"  Specialist Accuracy : {spec_acc*100:.1f}%")
    print(f"  Severity Accuracy   : {sev_acc*100:.1f}%")
    print(f"  CV Specialist F1    : {np.mean(cv_spec_f1):.3f}")
    print(f"  CV Severity F1      : {np.mean(cv_sev_f1):.3f}")
    print("=" * 60 + "\n")

    return model_data


if __name__ == "__main__":
    train()
