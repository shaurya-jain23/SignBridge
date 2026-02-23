import numpy as np
import cv2
import mediapipe as mp
import base64
from collections import deque, Counter
from tensorflow.keras.models import load_model
import os
import csv
import logging
from typing import Optional
import time

logger = logging.getLogger(__name__)

class DynamicGestureService:
    def __init__(self):
        # Instantiate MediaPipe Tasks API (Hand, Pose, Face)
        BaseOptions = mp.tasks.BaseOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        # Pose Landmarker
        pose_options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(os.path.dirname(__file__), '..', 'pose_landmarker_full.task')),
            running_mode=VisionRunningMode.IMAGE
        )
        self.pose_landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(pose_options)

        # Face Landmarker
        face_options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(os.path.dirname(__file__), '..', 'face_landmarker.task')),
            running_mode=VisionRunningMode.IMAGE,
            num_faces=1
        )
        self.face_landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(face_options)
        
        # Hand Landmarker (reused strictly for dynamic isolation)
        hand_options = mp.tasks.vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(os.path.dirname(__file__), '..', 'hand_landmarker.task')),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=2
        )
        self.hand_landmarker = mp.tasks.vision.HandLandmarker.create_from_options(hand_options)
        
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
            
        # Model parameters
        self.confidence_threshold = 0.80
        
        # Tracking logic
        self.sequence = deque(maxlen=30)
        self.predictions = deque(maxlen=5) 
        self.last_emission_time = 0.0
        self.latest_pose_landmarks = []
        
        # Thresholds
        self.motion_gate_threshold = 0.15 # Minimum coordinate delta to pass gate
        
    def _extract_keypoints(self, pose_res, face_res, hand_res):
        pose = np.zeros(33*4)
        if pose_res and pose_res.pose_landmarks:
            pose = np.array([[res.x, res.y, res.z, res.visibility] for res in pose_res.pose_landmarks[0]]).flatten()
            
        face = np.zeros(468*3)
        if face_res and face_res.face_landmarks:
            face = np.array([[res.x, res.y, res.z] for res in face_res.face_landmarks[0][:468]]).flatten()
            
        lh = np.zeros(21*3)
        rh = np.zeros(21*3)
        if hand_res and hand_res.hand_landmarks:
            for i, handedness_list in enumerate(hand_res.handedness):
                hand_label = handedness_list[0].category_name
                if hand_label == "Left":
                    lh = np.array([[res.x, res.y, res.z] for res in hand_res.hand_landmarks[i]]).flatten()
                elif hand_label == "Right":
                    rh = np.array([[res.x, res.y, res.z] for res in hand_res.hand_landmarks[i]]).flatten()

        return np.concatenate([pose, face, lh, rh])
        
    def _check_motion_gate(self):
        """Returns True if sufficient motion occurred across the 30 frame buffer."""
        if len(self.sequence) < 30:
            return False
            
        # Delta over 30 frames
        delta = np.sum(np.abs(self.sequence[0] - self.sequence[-1]))
        logger.debug(f"[LSTM] Motion Gate Delta: {delta:.2f} (Threshold: {self.motion_gate_threshold})")
        return delta > self.motion_gate_threshold

    def process_frame(self, frame_rgb) -> Optional[dict]:
        """
        Process the raw RGB frame for dynamic gesture recognition using Tasks APIs.
        """
        # Cooldown check: prevent rapid re-triggering within 1.5 seconds
        if time.time() - self.last_emission_time < 1.5:
            self.sequence.clear()
            self.predictions.clear()
            return None
            
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        # Extract full Holistic features sequentially via Tasks APIs
        pose_res = self.pose_landmarker.detect(mp_image)
        face_res = self.face_landmarker.detect(mp_image)
        hand_res = self.hand_landmarker.detect(mp_image)
        
        # Save pose landmarks for frontend rendering (Shoulders, Elbows, Wrists, Nose)
        self.latest_pose_landmarks = []
        if pose_res and pose_res.pose_landmarks:
            for idx in [0, 11, 12, 13, 14, 15, 16]:
                try:
                    lm = pose_res.pose_landmarks[0][idx]
                    self.latest_pose_landmarks.append({"x": lm.x, "y": lm.y, "visibility": lm.visibility, "index": idx})
                except IndexError:
                    pass
        
        keypoints = self._extract_keypoints(pose_res, face_res, hand_res)
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
            
            logger.debug(f"[LSTM] Inference: {label} ({confidence:.2f})")
            
            if confidence > self.confidence_threshold:
                self.predictions.append(label)
                logger.debug(f"[LSTM] Appended {label} to smoothing buffer (Size: {len(self.predictions)}/5)")
                
                # 6. Prediction Smoothing Check
                if len(self.predictions) == 5:
                    counter = Counter(self.predictions)
                    most_common, count = counter.most_common(1)[0]
                    
                    if count == 5: # Must be stable for all 5 consecutive frames
                        # Valid dynamic gesture! Reset buffers to prevent spam.
                        self.sequence.clear()
                        self.predictions.clear()
                        self.last_emission_time = time.time()
                        return {
                            "word": most_common,
                            "confidence": round(float(confidence), 2),
                            "type": "dynamic"
                        }
            else:
                # If confidence drops midway, break the streak
                if len(self.predictions) > 0:
                    logger.debug(f"[LSTM] Confidence dropped to {confidence:.2f}, clearing smoothing buffer.")
                    self.predictions.clear()
                    
        return None
