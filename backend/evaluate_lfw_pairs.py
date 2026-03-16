"""
Evaluate face verification performance on the public LFW pairs dataset.

Why this script exists:
- Gives reproducible, ethics-safe evidence for thesis/capstone defense.
- Uses the same DeepFace embedding model family as the backend pipeline.
- Reports standard metrics: accuracy, precision, recall, F1, confusion matrix,
  ROC-AUC, FAR, and FRR.

Usage:
  python backend/evaluate_lfw_pairs.py
  python backend/evaluate_lfw_pairs.py --max-pairs 300 --threshold 0.65
  python backend/evaluate_lfw_pairs.py --sweep
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np
from deepface import DeepFace
from sklearn.datasets import fetch_lfw_pairs
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


DEFAULT_MODEL = os.getenv("MODEL_NAME", "Facenet")
DEFAULT_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.65"))
RESULTS_DIR = Path("backend") / "eval_results"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate DeepFace on LFW pairs.")
    parser.add_argument(
        "--model-name",
        default=DEFAULT_MODEL,
        help="DeepFace model name (Facenet, VGG-Face, ArcFace, etc.)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_THRESHOLD,
        help="Similarity threshold for same-person prediction.",
    )
    parser.add_argument(
        "--max-pairs",
        type=int,
        default=600,
        help="Limit number of pairs to evaluate for faster runs.",
    )
    parser.add_argument(
        "--subset",
        choices=["train", "test", "10_folds"],
        default="10_folds",
        help="LFW subset split from scikit-learn loader.",
    )
    parser.add_argument(
        "--sweep",
        action="store_true",
        help="Also sweep thresholds and report best F1 threshold.",
    )
    return parser.parse_args()


def image_hash(image_rgb: np.ndarray) -> str:
    data = np.ascontiguousarray(image_rgb).tobytes()
    return hashlib.md5(data).hexdigest()


def lfw_to_bgr(image_rgb: np.ndarray) -> np.ndarray:
    # LFW loader returns float in [0, 1]. Convert to uint8 image expected by OpenCV/DeepFace.
    if image_rgb.dtype != np.uint8:
        image_rgb = np.clip(image_rgb * 255.0, 0, 255).astype(np.uint8)
    return cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    denom = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-12
    sim = float(np.dot(v1, v2) / denom)
    return float(np.clip(sim, 0.0, 1.0))


def face_embedding(image_bgr: np.ndarray, model_name: str) -> np.ndarray:
    # LFW images are already face crops, so we skip detection.
    resized = cv2.resize(image_bgr, (160, 160), interpolation=cv2.INTER_AREA)
    reps = DeepFace.represent(
        img_path=resized,
        model_name=model_name,
        detector_backend="skip",
        enforce_detection=False,
    )
    if not reps:
        raise ValueError("No embedding returned from DeepFace.represent")
    emb = np.array(reps[0]["embedding"], dtype=np.float32)
    return emb


def compute_metrics(y_true: np.ndarray, y_score: np.ndarray, threshold: float) -> Dict[str, float | int | None]:
    y_pred = (y_score >= threshold).astype(int)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    auc: float | None
    if len(np.unique(y_true)) < 2:
        auc = None
    else:
        auc = float(roc_auc_score(y_true, y_score))

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    far = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    frr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    return {
        "threshold": float(threshold),
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": auc,
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp),
        "far": far,
        "frr": frr,
    }


def sweep_thresholds(y_true: np.ndarray, y_score: np.ndarray) -> Dict[str, float | int | None]:
    best: Dict[str, float | int | None] | None = None
    for t in np.linspace(0.30, 0.90, 61):
        m = compute_metrics(y_true, y_score, float(t))
        if best is None or m["f1_score"] > best["f1_score"]:
            best = m
    return best if best is not None else {}


def save_results(
    rows: List[Dict[str, float]],
    summary: Dict[str, Dict[str, float | int | None]],
    run_meta: Dict[str, str],
) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_json = RESULTS_DIR / f"lfw_eval_{stamp}.json"
    out_csv = RESULTS_DIR / f"lfw_pairs_scores_{stamp}.csv"

    def sanitize_json(obj):
        if isinstance(obj, dict):
            return {k: sanitize_json(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [sanitize_json(v) for v in obj]
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        return obj

    payload = sanitize_json({"meta": run_meta, "summary": summary})
    with out_json.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, allow_nan=False)

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["pair_index", "y_true", "similarity"])
        writer.writeheader()
        writer.writerows(rows)

    return out_json


def main() -> None:
    args = parse_args()

    print("\n[1/4] Loading LFW pairs dataset...")
    lfw = fetch_lfw_pairs(subset=args.subset, color=True, resize=1.0)
    pairs = lfw.pairs
    labels = lfw.target.astype(int)

    if args.max_pairs > 0:
        pairs = pairs[: args.max_pairs]
        labels = labels[: args.max_pairs]

    print(f"Loaded pairs: {len(pairs)}")
    print(f"Model: {args.model_name}")
    print(f"Threshold: {args.threshold:.2f}")

    print("\n[2/4] Generating embeddings and similarities...")
    cache: Dict[str, np.ndarray] = {}
    y_score: List[float] = []
    pair_rows: List[Dict[str, float]] = []

    started = time.perf_counter()

    for i, pair in enumerate(pairs):
        img1_rgb = pair[0]
        img2_rgb = pair[1]

        key1 = image_hash(img1_rgb)
        key2 = image_hash(img2_rgb)

        if key1 not in cache:
            cache[key1] = face_embedding(lfw_to_bgr(img1_rgb), args.model_name)
        if key2 not in cache:
            cache[key2] = face_embedding(lfw_to_bgr(img2_rgb), args.model_name)

        sim = cosine_similarity(cache[key1], cache[key2])
        y_score.append(sim)
        pair_rows.append(
            {"pair_index": i, "y_true": int(labels[i]), "similarity": float(sim)}
        )

        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1}/{len(pairs)} pairs")

    elapsed_s = time.perf_counter() - started

    print("\n[3/4] Computing metrics...")
    y_true_np = np.array(labels, dtype=np.int32)
    y_score_np = np.array(y_score, dtype=np.float32)

    metrics = compute_metrics(y_true_np, y_score_np, args.threshold)
    best_metrics = sweep_thresholds(y_true_np, y_score_np) if args.sweep else {}

    print("\nEvaluation Summary")
    print("-" * 54)
    print(f"Pairs evaluated : {len(y_true_np)}")
    print(f"Runtime (sec)   : {elapsed_s:.2f}")
    print(f"Accuracy        : {metrics['accuracy']:.4f}")
    print(f"Precision       : {metrics['precision']:.4f}")
    print(f"Recall          : {metrics['recall']:.4f}")
    print(f"F1-score        : {metrics['f1_score']:.4f}")
    if metrics["roc_auc"] is None:
        print("ROC-AUC         : N/A (single-class sample)")
    else:
        print(f"ROC-AUC         : {metrics['roc_auc']:.4f}")
    print(f"FAR             : {metrics['far']:.4f}")
    print(f"FRR             : {metrics['frr']:.4f}")
    print(f"Confusion (tn/fp/fn/tp): {metrics['tn']}/{metrics['fp']}/{metrics['fn']}/{metrics['tp']}")
    if best_metrics:
        print(
            f"Best F1 threshold (sweep): {best_metrics['threshold']:.2f}, "
            f"F1={best_metrics['f1_score']:.4f}"
        )

    print("\n[4/4] Saving outputs...")
    run_meta = {
        "dataset": "LFW pairs (scikit-learn loader)",
        "subset": args.subset,
        "model_name": args.model_name,
        "threshold": str(args.threshold),
        "pairs_evaluated": str(len(y_true_np)),
        "runtime_seconds": f"{elapsed_s:.2f}",
        "timestamp": datetime.now().isoformat(),
    }
    saved_json = save_results(pair_rows, {"current_threshold": metrics, "best_f1": best_metrics}, run_meta)
    print(f"Saved summary: {saved_json}")
    print(f"Saved per-pair scores in: {RESULTS_DIR}")


if __name__ == "__main__":
    main()
