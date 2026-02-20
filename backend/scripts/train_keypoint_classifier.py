#!/usr/bin/env python
"""
train_keypoint_classifier.py

Trains a TFLite keypoint classifier on the ISL A-Z dataset.
Uses 84 input features (both hands, 42 each) and a deeper MLP.

Outputs:
  - keypoint_classifier.tflite
  - keypoint_classifier.hdf5
"""

import os
import csv
import numpy as np

# Suppress TF warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

DATASET_PATH = os.path.join(ROOT_DIR, "model", "keypoint_classifier", "keypoint.csv")
MODEL_SAVE_PATH = os.path.join(ROOT_DIR, "model", "keypoint_classifier", "keypoint_classifier.hdf5")
TFLITE_SAVE_PATH = os.path.join(ROOT_DIR, "model", "keypoint_classifier", "keypoint_classifier.tflite")

NUM_CLASSES = 26  # A-Z
INPUT_DIM = 84    # 21 landmarks × 2 (x,y) × 2 hands
BATCH_SIZE = 128
EPOCHS = 100
RANDOM_SEED = 42


# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
def load_dataset(path):
    X, y = [], []
    with open(path, "r") as f:
        reader = csv.reader(f)
        for row in reader:
            y.append(int(row[0]))
            X.append(list(map(float, row[1:])))
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ---------------------------------------------------------------------------
# Build model — deeper/wider MLP for 26-class with 84 features
# ---------------------------------------------------------------------------
def build_model(input_dim, num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_dim,)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])
    return model


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  SignBridge Pro — Keypoint Classifier Training (ISL A-Z)")
    print("  Using BOTH hands (84 features)")
    print("=" * 60)

    # Load
    X, y = load_dataset(DATASET_PATH)
    print(f"\nDataset: {len(X)} samples, {X.shape[1]} features, {NUM_CLASSES} classes")

    if X.shape[1] != INPUT_DIM:
        print(f"  WARNING: Expected {INPUT_DIM} features but got {X.shape[1]}")
        print(f"  Adjusting INPUT_DIM to {X.shape[1]}")

    actual_dim = X.shape[1]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # Build
    model = build_model(actual_dim, NUM_CLASSES)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=20, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=7, min_lr=1e-6
        ),
    ]

    # Train
    print("\n" + "-" * 40)
    print("  Training...")
    print("-" * 40)
    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_data=(X_test, y_test),
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate
    print("\n" + "-" * 40)
    print("  Evaluation")
    print("-" * 40)
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"  Test Loss:     {test_loss:.4f}")
    print(f"  Test Accuracy: {test_acc:.4f}  ({test_acc*100:.1f}%)")

    if test_acc >= 0.90:
        print("  ✅ Target accuracy (>90%) ACHIEVED!")
    else:
        print("  ⚠️ Below target accuracy (90%). Consider more data or tuning.")

    # Save HDF5
    model.save(MODEL_SAVE_PATH)
    print(f"\n  HDF5 saved: {MODEL_SAVE_PATH}")

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    with open(TFLITE_SAVE_PATH, "wb") as f:
        f.write(tflite_model)
    print(f"  TFLite saved: {TFLITE_SAVE_PATH}")
    print(f"  TFLite size: {len(tflite_model) / 1024:.1f} KB")

    # Per-class accuracy
    print("\n" + "-" * 40)
    print("  Per-class accuracy")
    print("-" * 40)
    y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
    labels = [chr(ord("A") + i) for i in range(NUM_CLASSES)]
    for cls_id in range(NUM_CLASSES):
        mask = y_test == cls_id
        cls_acc = np.mean(y_pred[mask] == y_test[mask]) * 100
        print(f"  {labels[cls_id]}: {cls_acc:5.1f}%  (n={mask.sum()})")

    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
