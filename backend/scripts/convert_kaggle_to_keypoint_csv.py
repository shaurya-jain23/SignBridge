#!/usr/bin/env python
"""
convert_kaggle_to_keypoint_csv.py

Converts the Kaggle ISL hand landmarks dataset into the repo's keypoint.csv
format used by the keypoint classifier.

Uses BOTH hands concatenated:
  - Right hand: 21 landmarks × (x, y) = 42 features
  - Left hand:  21 landmarks × (x, y) = 42 features
  - Total: 84 features per sample

Each hand is independently normalized (relative to its own wrist).
If a hand has no data (all zeros), its features are set to 0.
"""

import os
import csv
import itertools
import copy
import argparse

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
KAGGLE_CSV = os.path.expanduser(
    "~/.cache/kagglehub/datasets/eraakash/indian-sign-language-hand-landmarks-dataset/versions/1/"
    "Indian Sign Language Gesture Landmarks.csv"
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

OUTPUT_KEYPOINT_CSV = os.path.join(
    ROOT_DIR, "model", "keypoint_classifier", "keypoint.csv"
)
OUTPUT_LABEL_CSV = os.path.join(
    ROOT_DIR, "model", "keypoint_classifier", "keypoint_classifier_label.csv"
)

# A-Z labels (0=A, 1=B, ... 25=Z)
LABELS = [chr(ord("A") + i) for i in range(26)]

# Feature count per hand
FEATURES_PER_HAND = 42  # 21 landmarks × 2 (x, y)
TOTAL_FEATURES = FEATURES_PER_HAND * 2  # 84 (both hands)


# ---------------------------------------------------------------------------
# Pre-processing (same logic as the original app.py)
# ---------------------------------------------------------------------------
def pre_process_landmark(landmark_xy_list: list) -> list:
    """
    Takes [[x0,y0], [x1,y1], ...] (pixel or normalized coords),
    converts to relative (origin=wrist) and normalizes to [-1, 1].
    Returns flat list of 42 floats.
    """
    temp = copy.deepcopy(landmark_xy_list)

    # Relative coordinates (subtract wrist position)
    base_x, base_y = temp[0][0], temp[0][1]
    for point in temp:
        point[0] -= base_x
        point[1] -= base_y

    # Flatten
    flat = list(itertools.chain.from_iterable(temp))

    # Normalize
    max_val = max(map(abs, flat))
    if max_val > 0:
        flat = [v / max_val for v in flat]

    return flat


def extract_landmarks(row, hand="right"):
    """Extract 21 (x,y) landmarks for the specified hand from a dataset row."""
    landmarks = []
    prefix = f"{hand}_hand"
    for i in range(21):
        x = row.get(f"{prefix}_x_{i}", 0.0)
        y = row.get(f"{prefix}_y_{i}", 0.0)
        if pd.isna(x):
            x = 0.0
        if pd.isna(y):
            y = 0.0
        landmarks.append([float(x), float(y)])
    return landmarks


def hand_has_data(landmarks):
    """Check if a hand has non-zero landmark data."""
    return any(x != 0.0 or y != 0.0 for x, y in landmarks)


# ---------------------------------------------------------------------------
# Main conversion
# ---------------------------------------------------------------------------
def convert(input_csv: str, output_csv: str, label_csv: str):
    print(f"Loading: {input_csv}")
    df = pd.read_csv(input_csv)
    print(f"  {len(df)} samples, {len(df.columns)} columns")
    print(f"  Classes: {sorted(df['target'].unique())}")

    rows_out = []
    skipped = 0

    for idx, row in df.iterrows():
        label = int(row["target"])

        # Extract both hands
        right_lm = extract_landmarks(row, "right")
        left_lm = extract_landmarks(row, "left")

        right_has = hand_has_data(right_lm)
        left_has = hand_has_data(left_lm)

        if not right_has and not left_has:
            skipped += 1
            continue

        # Process each hand independently
        right_features = pre_process_landmark(right_lm) if right_has else [0.0] * FEATURES_PER_HAND
        left_features = pre_process_landmark(left_lm) if left_has else [0.0] * FEATURES_PER_HAND

        # Concatenate: right (42) + left (42) = 84 features
        features = right_features + left_features

        rows_out.append([label] + features)

        if (idx + 1) % 10000 == 0:
            print(f"  Processed {idx + 1}/{len(df)} rows...")

    print(f"  Converted: {len(rows_out)} samples ({skipped} skipped)")
    print(f"  Feature dimension: {TOTAL_FEATURES}")

    # Write output keypoint CSV
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    with open(output_csv, "w", newline="") as f:
        writer = csv.writer(f)
        for row in rows_out:
            writer.writerow(row)
    print(f"  Written: {output_csv}")

    # Write label CSV
    with open(label_csv, "w", newline="") as f:
        writer = csv.writer(f)
        for label_str in LABELS:
            writer.writerow([label_str])
    print(f"  Written: {label_csv}")

    # Distribution check
    from collections import Counter
    dist = Counter(r[0] for r in rows_out)
    for cls_id in sorted(dist.keys()):
        print(f"    Class {cls_id} ({LABELS[cls_id]}): {dist[cls_id]} samples")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Kaggle ISL dataset to keypoint CSV")
    parser.add_argument("--input", default=KAGGLE_CSV, help="Path to Kaggle CSV")
    parser.add_argument("--output", default=OUTPUT_KEYPOINT_CSV, help="Output keypoint.csv")
    parser.add_argument("--labels", default=OUTPUT_LABEL_CSV, help="Output label CSV")
    args = parser.parse_args()

    convert(args.input, args.output, args.labels)
