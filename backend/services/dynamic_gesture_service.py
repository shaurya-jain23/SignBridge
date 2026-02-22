import numpy as np
import cv2
import mediapipe as mp
import base64
from collections import deque, Counter
from tensorflow.keras.models import load_model
import os
import csv
import logging

logger = logging.getLogger(__name__)

class DynamicGestureService:
    def __init__(self):
        # MediaPipe Holistic dependency removed for Hand-Only bypass

        # Load Keras LSTM model
        model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'lstm_classifier', 'action.h5')
        self.model = load_model(model_path)
        
        # Load Labels
        labels_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'lstm_classifier', 'dynamic_labels.csv')
        self.labels = []
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                reader = csv.reader(f)
                self.labels = [row[1] for row in reader]
        else:
            self.labels = ['happy', 'hello', 'iloveyou', 'ok', 'sad', 'thanks']
            
        # Sliding temporal window
        self.sequence = deque(maxlen=30)
        
        # Prediction Smoothing (requires 5 consistent frames)
        self.predictions = deque(maxlen=5)
        
        # Thresholds
        self.confidence_threshold = 0.8
        self.motion_gate_threshold = 0.15 # Minimum coordinate delta to pass gate
        
    def _extract_hand_keypoints(self, left_hand, right_hand):
        """Extracts 126 hand features (63 LH + 63 RH) to match sliced Kaggle dataset."""
        lh = np.zeros(63)
        if left_hand:
            lh = np.array([[res.x, res.y, res.z] for res in left_hand]).flatten()
            
        rh = np.zeros(63)
        if right_hand:
            rh = np.array([[res.x, res.y, res.z] for res in right_hand]).flatten()
            
        return np.concatenate([lh, rh])
        
    def _check_motion_gate(self):
        """Returns True if sufficient motion occurred across the 30 frame buffer."""
        if len(self.sequence) < 30:
            return False
            
        # Delta of the full 126 features over 30 frames
        delta = np.sum(np.abs(self.sequence[0] - self.sequence[-1]))
        logger.debug(f"[LSTM] Motion Gate Delta: {delta:.2f} (Threshold: {self.motion_gate_threshold})")
        return delta > self.motion_gate_threshold

    def process_frame_landmarks(self, left_hand, right_hand):
        """
        Processes 3D hand landmarks, updates the sliding window, and returns dynamic prediction.
        Returns None if no stable dynamic gesture is detected.
        """
        # 1. Extract 126 features
        keypoints = self._extract_hand_keypoints(left_hand, right_hand)
        self.sequence.append(keypoints)
        
        # 3. Buffer full check
        if len(self.sequence) == 30:
            
            # 4. Motion Gate
            if not self._check_motion_gate():
                # No significant movement -> clear prediction buffer, return None
                self.predictions.clear()
                return None
                
            # 5. Run LSTM Inference
            sequence_arr = np.expand_dims(list(self.sequence), axis=0)
            res = self.model.predict(sequence_arr, verbose=0)[0]
            
            best_idx = np.argmax(res)
            confidence = res[best_idx]
            label = self.labels[best_idx]
            
            if confidence > self.confidence_threshold:
                self.predictions.append(label)
                
                # 6. Prediction Smoothing Check
                if len(self.predictions) == 5:
                    counter = Counter(self.predictions)
                    most_common, count = counter.most_common(1)[0]
                    
                    if count == 5: # Must be stable for all 5 frames
                        return {
                            "word": most_common,
                            "confidence": round(float(confidence), 2),
                            "type": "dynamic"
                        }
        return None
