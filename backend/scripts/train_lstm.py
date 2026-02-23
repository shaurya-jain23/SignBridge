import os
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import csv

# --- CONFIGURATION ---
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'MP_Data', 'datasaved')
actions = np.array(['happy', 'hello', 'iloveyou', 'ok', 'sad', 'thanks'])
no_sequences = 60
sequence_length = 30
feature_size = 1662 # Full Holistic Pipeline (Pose, Face, LH, RH)

model_dir = os.path.join(os.path.dirname(__file__), '..', 'model', 'lstm_classifier')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'action.h5')
labels_path = os.path.join(model_dir, 'dynamic_labels.csv')

print("Step 1: Building Numpy Loader...")
label_map = {label:num for num, label in enumerate(actions)}

# Save labels
with open(labels_path, 'w', newline='') as f:
    writer = csv.writer(f)
    for i, a in enumerate(actions):
        writer.writerow([i, a])
print(f"Saved labels to {labels_path}")

sequences, labels = [], []
for action in actions:
    print(f"Loading {action}...")
    for sequence in range(no_sequences):
        window = []
        for frame_num in range(sequence_length):
            res = np.load(os.path.join(DATA_PATH, action, str(sequence), "{}.npy".format(frame_num)))
            # Use full 1662 features
            window.append(res)
        sequences.append(window)
        labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(labels).astype(int)

print(f"X shape: {X.shape}") # Should be (360, 30, 1662)
print(f"y shape: {y.shape}") # Should be (360, 6)

print("\nStep 2: Train/Test Split (80/20)...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")

print("\nStep 3: Building Lightweight LSTM Architecture...")
model = Sequential()
model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(sequence_length, feature_size)))
model.add(LSTM(64, activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(actions.shape[0], activation='softmax'))

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# Optional: Add callbacks
checkpoint = ModelCheckpoint(model_path, monitor='val_categorical_accuracy', save_best_only=True, mode='max', verbose=1)
early_stop = EarlyStopping(monitor='val_loss', patience=25, restore_best_weights=True)

print("\nStep 4: Training...")
model.fit(X_train, y_train, epochs=150, validation_data=(X_test, y_test), callbacks=[checkpoint, early_stop])

print(f"\nTraining Complete! Best model saved to {model_path}")
