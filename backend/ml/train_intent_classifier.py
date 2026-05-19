"""
Synora Health — DistilBERT Intent Classifier Fine-Tuning Script
================================================================
Fine-tunes distilbert-base-uncased on our custom healthcare intent dataset.

Intent classes:
  emergency | symptom_query | medication_query |
  report_query | appointment_query | general_wellness

Outputs:
  - models/intent_classifier/          (fine-tuned model + tokenizer)
  - models/intent_training_curves.png  (loss + accuracy per epoch)
  - models/intent_training_report.txt  (metrics + confusion matrix)

Run:
    python -m ml.train_intent_classifier

Requirements:
    pip install transformers torch scikit-learn matplotlib seaborn
"""

import os
import sys
import json
import time
import random
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
INTENT_MODEL_DIR = os.path.join(MODELS_DIR, "intent_classifier")
os.makedirs(INTENT_MODEL_DIR, exist_ok=True)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTS_ENABLED = True
except ImportError:
    PLOTS_ENABLED = False

from ml.intent_dataset import get_intent_dataset, INTENT_LABELS, LABEL2ID, ID2LABEL


# ──────────────────────────────────────────────────────────────────────────────
# Reproducibility
# ──────────────────────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)


def set_torch_seed(seed=SEED):
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


# ──────────────────────────────────────────────────────────────────────────────
# Data helpers
# ──────────────────────────────────────────────────────────────────────────────

def prepare_splits(test_ratio=0.2):
    from sklearn.model_selection import train_test_split
    data = get_intent_dataset()
    texts  = [d["text"]  for d in data]
    labels = [LABEL2ID[d["label"]] for d in data]
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=test_ratio, random_state=SEED, stratify=labels
    )
    return X_train, X_test, y_train, y_test


# ──────────────────────────────────────────────────────────────────────────────
# PyTorch Dataset
# ──────────────────────────────────────────────────────────────────────────────

def make_torch_dataset(texts, labels, tokenizer, max_length=128):
    import torch
    from torch.utils.data import Dataset

    class HealthIntentDataset(Dataset):
        def __init__(self, texts, labels, tokenizer, max_length):
            self.encodings = tokenizer(
                texts,
                truncation=True,
                padding="max_length",
                max_length=max_length,
                return_tensors="pt",
            )
            self.labels = torch.tensor(labels, dtype=torch.long)

        def __len__(self):
            return len(self.labels)

        def __getitem__(self, idx):
            return {
                "input_ids":      self.encodings["input_ids"][idx],
                "attention_mask": self.encodings["attention_mask"][idx],
                "labels":         self.labels[idx],
            }

    return HealthIntentDataset(texts, labels, tokenizer, max_length)


# ──────────────────────────────────────────────────────────────────────────────
# Training loop
# ──────────────────────────────────────────────────────────────────────────────

def train_epoch(model, loader, optimizer, scheduler, device):
    import torch
    model.train()
    total_loss, correct, total = 0, 0, 0
    for batch in loader:
        input_ids      = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels         = batch["labels"].to(device)

        optimizer.zero_grad()
        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()

        total_loss += loss.item()
        preds = outputs.logits.argmax(dim=-1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    return total_loss / len(loader), correct / total


def eval_epoch(model, loader, device):
    import torch
    model.eval()
    total_loss, correct, total = 0, 0, 0
    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in loader:
            input_ids      = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels         = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            total_loss += outputs.loss.item()
            preds = outputs.logits.argmax(dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    return total_loss / len(loader), correct / total, all_preds, all_labels


# ──────────────────────────────────────────────────────────────────────────────
# Plots
# ──────────────────────────────────────────────────────────────────────────────

def plot_training_curves(history):
    if not PLOTS_ENABLED:
        return
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Loss
    axes[0].plot(epochs, history["train_loss"], "b-o", label="Train Loss", linewidth=2)
    axes[0].plot(epochs, history["val_loss"],   "r-o", label="Val Loss",   linewidth=2)
    axes[0].set_xlabel("Epoch");  axes[0].set_ylabel("Cross-Entropy Loss")
    axes[0].set_title("Training vs Validation Loss", fontweight="bold")
    axes[0].legend(); axes[0].grid(True, alpha=0.3)

    # Accuracy
    axes[1].plot(epochs, [a * 100 for a in history["train_acc"]], "b-o", label="Train Acc", linewidth=2)
    axes[1].plot(epochs, [a * 100 for a in history["val_acc"]],   "r-o", label="Val Acc",   linewidth=2)
    axes[1].set_xlabel("Epoch");  axes[1].set_ylabel("Accuracy (%)")
    axes[1].set_title("Training vs Validation Accuracy", fontweight="bold")
    axes[1].legend(); axes[1].grid(True, alpha=0.3)
    axes[1].set_ylim([0, 105])

    plt.suptitle("Synora Health — DistilBERT Intent Classifier Fine-Tuning", fontsize=13, fontweight="bold")
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, "intent_training_curves.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {path}")


def plot_intent_confusion(all_preds, all_labels):
    if not PLOTS_ENABLED:
        return
    from sklearn.metrics import confusion_matrix
    cm = confusion_matrix(all_labels, all_preds)
    fig, ax = plt.subplots(figsize=(9, 7))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Greens",
        xticklabels=INTENT_LABELS, yticklabels=INTENT_LABELS, ax=ax
    )
    ax.set_xlabel("Predicted Intent", fontsize=12)
    ax.set_ylabel("Actual Intent",    fontsize=12)
    ax.set_title("Intent Classifier — Confusion Matrix", fontsize=14, fontweight="bold")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, "intent_confusion_matrix.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {path}")


# ──────────────────────────────────────────────────────────────────────────────
# Main training entry
# ──────────────────────────────────────────────────────────────────────────────

def train(
    model_name: str = "distilbert-base-uncased",
    epochs: int = 8,
    batch_size: int = 16,
    learning_rate: float = 3e-5,
    max_length: int = 128,
):
    try:
        import torch
        from torch.utils.data import DataLoader
        from transformers import (
            DistilBertTokenizerFast,
            DistilBertForSequenceClassification,
            get_linear_schedule_with_warmup,
        )
        from torch.optim import AdamW
        from sklearn.metrics import classification_report
    except ImportError as e:
        print(f"\n[ERROR] Missing dependency: {e}")
        print("  Install with: pip install transformers torch scikit-learn")
        sys.exit(1)

    set_torch_seed()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print("\n" + "=" * 65)
    print("  SYNORA HEALTH — DISTILBERT INTENT CLASSIFIER FINE-TUNING")
    print("=" * 65)
    print(f"\n  Base model  : {model_name}")
    print(f"  Device      : {device}")
    print(f"  Epochs      : {epochs}")
    print(f"  Batch size  : {batch_size}")
    print(f"  LR          : {learning_rate}")
    print(f"  Intent classes ({len(INTENT_LABELS)}): {INTENT_LABELS}")

    # Data
    print("\n[1/6] Loading and tokenising dataset ...")
    X_train, X_test, y_train, y_test = prepare_splits()
    print(f"      Train: {len(X_train)} | Test: {len(X_test)}")

    tokenizer = DistilBertTokenizerFast.from_pretrained(model_name)
    train_ds = make_torch_dataset(X_train, y_train, tokenizer, max_length)
    test_ds  = make_torch_dataset(X_test,  y_test,  tokenizer, max_length)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader  = DataLoader(test_ds,  batch_size=batch_size)

    # Model
    print(f"\n[2/6] Loading {model_name} for sequence classification ...")
    model = DistilBertForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(INTENT_LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    model.to(device)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"      Parameters: {total_params:,}")

    # Optimizer & scheduler
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps,
    )

    # Training loop
    print(f"\n[3/6] Fine-tuning for {epochs} epochs ...\n")
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, scheduler, device)
        val_loss,   val_acc, all_preds, all_labels = eval_epoch(model, test_loader, device)
        elapsed = time.time() - t0

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)

        marker = " *** BEST ***" if val_acc > best_val_acc else ""
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_preds, best_labels = all_preds, all_labels

        print(
            f"  Epoch {epoch:02d}/{epochs}  "
            f"Train Loss: {train_loss:.4f}  Train Acc: {train_acc*100:.1f}%  |  "
            f"Val Loss: {val_loss:.4f}  Val Acc: {val_acc*100:.1f}%  "
            f"[{elapsed:.1f}s]{marker}"
        )

    # Final evaluation
    print(f"\n[4/6] Final Evaluation:")
    report = classification_report(
        best_labels, best_preds,
        target_names=INTENT_LABELS,
        zero_division=0
    )
    print(report)

    # Plots
    print("[5/6] Saving visualisations ...")
    plot_training_curves(history)
    plot_intent_confusion(best_preds, best_labels)

    # Save fine-tuned model
    print(f"\n[6/6] Saving fine-tuned model to {INTENT_MODEL_DIR} ...")
    model.save_pretrained(INTENT_MODEL_DIR)
    tokenizer.save_pretrained(INTENT_MODEL_DIR)

    # Save config metadata
    meta = {
        "base_model":    model_name,
        "intent_labels": INTENT_LABELS,
        "label2id":      LABEL2ID,
        "id2label":      {str(k): v for k, v in ID2LABEL.items()},
        "best_val_accuracy": round(best_val_acc, 4),
        "epochs_trained": epochs,
        "train_samples": len(X_train),
        "test_samples":  len(X_test),
        "final_history": history,
    }
    meta_path = os.path.join(INTENT_MODEL_DIR, "training_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Metadata saved: {meta_path}")

    # Text report
    report_path = os.path.join(MODELS_DIR, "intent_training_report.txt")
    with open(report_path, "w") as f:
        f.write("SYNORA HEALTH — DISTILBERT INTENT CLASSIFIER REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Base model       : {model_name}\n")
        f.write(f"Fine-tuned on    : {len(X_train)} healthcare intent samples\n")
        f.write(f"Test set         : {len(X_test)} samples\n")
        f.write(f"Epochs           : {epochs}\n")
        f.write(f"Best Val Accuracy: {best_val_acc*100:.1f}%\n\n")
        f.write("Intent Classes:\n")
        for i, label in enumerate(INTENT_LABELS):
            f.write(f"  {i}: {label}\n")
        f.write(f"\n--- Classification Report (Best Epoch) ---\n{report}\n")
        f.write("\nEpoch History:\n")
        for i in range(epochs):
            f.write(
                f"  Epoch {i+1}: train_loss={history['train_loss'][i]:.4f}  "
                f"train_acc={history['train_acc'][i]*100:.1f}%  "
                f"val_loss={history['val_loss'][i]:.4f}  "
                f"val_acc={history['val_acc'][i]*100:.1f}%\n"
            )
    print(f"  Report saved: {report_path}")

    print("\n" + "=" * 65)
    print("  FINE-TUNING COMPLETE")
    print(f"  Best Validation Accuracy : {best_val_acc*100:.1f}%")
    print(f"  Model saved to           : {INTENT_MODEL_DIR}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    train()
