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
            
        # Model parameters (calibrated for real-time webcam noise)
        self.base_confidence_threshold = 0.82
        self.base_margin_threshold = 0.10
        self.class_confidence_thresholds = {
            # "ok" tends to have lower confidence in live use, so keep it lower.
            "ok": 0.62,
            "hello": 0.72,
            # Keep this stricter to reduce false "iloveyou" triggers.
            "iloveyou": 0.90,
        }
        self.class_margin_thresholds = {
            "ok": 0.03,
            "hello": 0.06,
            "iloveyou": 0.14,
        }
        
        # Tracking logic
        self.sequence = deque(maxlen=30)
        self.predictions = deque(maxlen=5)
        self.heuristic_predictions = deque(maxlen=8)
        self.last_emission_time = 0.0
        self.latest_pose_landmarks = []
        self.right_wrist_x_history = deque(maxlen=30)
        self.open_palm_history = deque(maxlen=30)
        
        # Thresholds
        self.motion_gate_threshold = 3.0  # Minimum coordinate delta to pass gate

    def _reset_dynamic_state(self):
        self.sequence.clear()
        self.predictions.clear()
        self.heuristic_predictions.clear()
        self.right_wrist_x_history.clear()
        self.open_palm_history.clear()

    @staticmethod
    def _distance_2d(pt1, pt2):
        return float(np.hypot(pt1.x - pt2.x, pt1.y - pt2.y))

    def _is_open_palm(self, hand_landmarks) -> bool:
        if hand_landmarks is None or len(hand_landmarks) < 21:
            return False

        # Tip above PIP in image space => finger extended.
        finger_pairs = [(8, 6), (12, 10), (16, 14), (20, 18)]
        extended = 0
        for tip_idx, pip_idx in finger_pairs:
            if hand_landmarks[tip_idx].y < hand_landmarks[pip_idx].y:
                extended += 1
        return extended >= 3

    def _is_ok_hand_shape(self, hand_landmarks) -> bool:
        if hand_landmarks is None or len(hand_landmarks) < 21:
            return False

        wrist = hand_landmarks[0]
        middle_mcp = hand_landmarks[9]
        hand_scale = max(self._distance_2d(wrist, middle_mcp), 1e-6)

        thumb_tip = hand_landmarks[4]
        index_tip = hand_landmarks[8]
        pinch_ratio = self._distance_2d(thumb_tip, index_tip) / hand_scale

        # Middle/ring/pinky should be reasonably extended for "ok".
        extension_checks = [
            hand_landmarks[12].y < hand_landmarks[10].y,
            hand_landmarks[16].y < hand_landmarks[14].y,
            hand_landmarks[20].y < hand_landmarks[18].y,
        ]
        extended_count = sum(1 for ok in extension_checks if ok)

        return pinch_ratio < 0.55 and extended_count >= 2

    def _wrist_direction_changes(self) -> int:
        xs = [x for x in self.right_wrist_x_history if x is not None]
        if len(xs) < 8:
            return 0

        diffs = np.diff(xs)
        # Ignore micro jitter.
        filtered = [d for d in diffs if abs(d) > 0.003]
        if len(filtered) < 3:
            return 0

        signs = np.sign(filtered)
        return int(np.sum(signs[1:] != signs[:-1]))

    def _heuristic_dynamic_label(self, primary_hand_landmarks) -> Optional[str]:
        # OK is mostly a shape gesture and often gets blocked by motion gate.
        if self._is_ok_hand_shape(primary_hand_landmarks):
            return "ok"

        # HELLO is usually a lateral wave with open palm.
        wrist_x_range = self._right_wrist_horizontal_range()
        direction_changes = self._wrist_direction_changes()
        open_ratio = (
            sum(1 for b in self.open_palm_history if b) / len(self.open_palm_history)
            if self.open_palm_history
            else 0.0
        )
        if wrist_x_range > 0.10 and direction_changes >= 2 and open_ratio >= 0.60:
            return "hello"

        return None

    def _required_confidence(self, label: str) -> float:
        return self.class_confidence_thresholds.get(label, self.base_confidence_threshold)

    def _required_margin(self, label: str) -> float:
        return self.class_margin_thresholds.get(label, self.base_margin_threshold)

    def _right_wrist_horizontal_range(self) -> float:
        xs = [x for x in self.right_wrist_x_history if x is not None]
        if len(xs) < 5:
            return 0.0
        return float(max(xs) - min(xs))
        
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
            self._reset_dynamic_state()
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

        # Track right wrist horizontal motion to reduce hello/iloveyou confusion.
        right_wrist_x = None
        primary_hand_landmarks = None
        if hand_res and hand_res.hand_landmarks:
            for i, handedness_list in enumerate(hand_res.handedness):
                hand_label = handedness_list[0].category_name
                if hand_label == "Right" and len(hand_res.hand_landmarks[i]) > 0:
                    primary_hand_landmarks = hand_res.hand_landmarks[i]
                    right_wrist_x = hand_res.hand_landmarks[i][0].x
                    break
            if right_wrist_x is None and len(hand_res.hand_landmarks[0]) > 0:
                # Fallback when handedness is uncertain.
                primary_hand_landmarks = hand_res.hand_landmarks[0]
                right_wrist_x = hand_res.hand_landmarks[0][0].x

        self.right_wrist_x_history.append(right_wrist_x)
        self.open_palm_history.append(self._is_open_palm(primary_hand_landmarks))

        heuristic_label = self._heuristic_dynamic_label(primary_hand_landmarks)
        self.heuristic_predictions.append(heuristic_label or "")
        
        keypoints = self._extract_keypoints(pose_res, face_res, hand_res)
        self.sequence.append(keypoints)
        
        # 3. Buffer full check
        if len(self.sequence) == 30:
            # Heuristic fallback path for hard classes in noisy real-time webcams.
            if len(self.heuristic_predictions) == self.heuristic_predictions.maxlen:
                non_empty = [p for p in self.heuristic_predictions if p]
                if non_empty:
                    h_counter = Counter(non_empty)
                    h_label, h_count = h_counter.most_common(1)[0]
                    required_votes = 5 if h_label == "ok" else 4
                    if h_count >= required_votes:
                        logger.debug(
                            f"[LSTM] Heuristic emission: {h_label} (votes={h_count}/{self.heuristic_predictions.maxlen})"
                        )
                        self._reset_dynamic_state()
                        self.last_emission_time = time.time()
                        return {
                            "word": h_label,
                            "confidence": 0.9 if h_label == "ok" else 0.88,
                            "type": "dynamic",
                        }
            
            # 4. Motion Gate
            if not self._check_motion_gate():
                # No significant movement -> clear prediction buffer, return None
                self.predictions.clear()
                return None
                
            # 5. Run LSTM Inference
            sequence_arr = np.expand_dims(list(self.sequence), axis=0)
            res = self.model.predict(sequence_arr, verbose=0)[0]
            
            top2_idx = np.argsort(res)[-2:][::-1]
            best_idx = int(top2_idx[0])
            second_idx = int(top2_idx[1])
            confidence = float(res[best_idx])
            second_confidence = float(res[second_idx])
            label = self.labels[best_idx]
            second_label = self.labels[second_idx]
            margin = confidence - second_confidence
            relabeled = False

            # Heuristic: "hello" involves lateral hand movement and can be misread as "iloveyou".
            wrist_x_range = self._right_wrist_horizontal_range()
            if (
                label == "iloveyou"
                and second_label == "hello"
                and wrist_x_range > 0.10
                and second_confidence >= self._required_confidence("hello") - 0.05
            ):
                logger.debug(
                    f"[LSTM] Heuristic relabel iloveyou→hello (wrist_x_range={wrist_x_range:.3f}, conf2={second_confidence:.2f})"
                )
                label = "hello"
                confidence = second_confidence
                margin = abs(confidence - float(res[best_idx]))
                relabeled = True

            # Heuristic: allow "ok" when it is a close runner-up with sufficient confidence.
            if (
                label != "ok"
                and second_label == "ok"
                and second_confidence >= self._required_confidence("ok")
                and margin < 0.12
            ):
                logger.debug(
                    f"[LSTM] Heuristic relabel {label}→ok (conf2={second_confidence:.2f}, margin={margin:.3f})"
                )
                label = "ok"
                confidence = second_confidence
                margin = abs(second_confidence - float(res[best_idx]))
                relabeled = True

            if relabeled:
                margin = max(margin, self._required_margin(label))

            logger.debug(
                f"[LSTM] Inference: {label} (conf={confidence:.2f}, margin={margin:.3f}, wrist_x_range={wrist_x_range:.3f})"
            )

            required_conf = self._required_confidence(label)
            required_margin = self._required_margin(label)

            if confidence >= required_conf and margin >= required_margin:
                self.predictions.append(label)
                logger.debug(f"[LSTM] Appended {label} to smoothing buffer (Size: {len(self.predictions)}/5)")
                
                # 6. Prediction Smoothing Check
                if len(self.predictions) == 5:
                    counter = Counter(self.predictions)
                    most_common, count = counter.most_common(1)[0]

                    # Allow slightly softer smoothing for "ok" to improve recall.
                    required_votes = 3 if most_common == "ok" else 4

                    if count >= required_votes:
                        # Valid dynamic gesture! Reset buffers to prevent spam.
                        self._reset_dynamic_state()
                        self.last_emission_time = time.time()
                        return {
                            "word": most_common,
                            "confidence": round(float(confidence), 2),
                            "type": "dynamic"
                        }
            else:
                # If confidence drops midway, break the streak
                if len(self.predictions) > 0:
                    logger.debug(
                        f"[LSTM] Rejected {label} (conf={confidence:.2f}/{required_conf:.2f}, margin={margin:.3f}/{required_margin:.3f}), clearing smoothing buffer."
                    )
                    self.predictions.clear()
                    
        return None
