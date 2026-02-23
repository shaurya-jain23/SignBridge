"""
SignBridge Pro — Gesture Recognition Service (Phase 1)

Real-time MediaPipe HandLandmarker (Task API) + TFLite keypoint classification.
Uses BOTH hands (84 features) for ISL A-Z recognition.
Includes prediction smoothing and sentence building.
"""

import os
import copy
import csv
import base64
import itertools
import logging
from collections import deque, Counter

import cv2
import numpy as np
import mediapipe as mp

from model.keypoint_classifier.keypoint_classifier import KeyPointClassifier
from .dynamic_gesture_service import DynamicGestureService

logger = logging.getLogger("signbridge")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

HAND_LANDMARKER_MODEL = os.path.join(ROOT_DIR, "hand_landmarker.task")

KEYPOINT_LABEL_PATH = os.path.join(
    ROOT_DIR, "model", "keypoint_classifier", "keypoint_classifier_label.csv"
)

FEATURES_PER_HAND = 42  # 21 landmarks × 2 (x, y)


# ---------------------------------------------------------------------------
# Gesture Service class
# ---------------------------------------------------------------------------
class GestureService:
    """Encapsulates MediaPipe hand detection + TFLite gesture classification."""

    def __init__(self):
        # MediaPipe HandLandmarker (Task API — v0.10+)
        BaseOptions = mp.tasks.BaseOptions
        HandLandmarker = mp.tasks.vision.HandLandmarker
        HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=HAND_LANDMARKER_MODEL),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=2,  # Detect both hands for two-hand ISL signs
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.hand_landmarker = HandLandmarker.create_from_options(options)

        # Initialize TFLite KeyPointClassifier (Alphabet)
        self.keypoint_classifier = KeyPointClassifier()
        self.keypoint_labels = self._load_labels(KEYPOINT_LABEL_PATH)
        
        # Initialize Dynamic Gesture Service (Motion phrases)
        self.dynamic_service = DynamicGestureService()

        # Static Prediction Smoothing State
        # Requires 8 out of 10 identical frames to emit a letter
        self.prediction_buffer = deque(maxlen=10)

        logger.info(
            f"GestureService initialized — "
            f"{len(self.keypoint_labels)} keypoint labels (ISL A-Z)"
        )

    @staticmethod
    def _load_labels(path: str) -> list[str]:
        """Load label CSV into a list."""
        labels = []
        if os.path.exists(path):
            with open(path, encoding="utf-8-sig") as f:
                reader = csv.reader(f)
                for row in reader:
                    labels.append(row[0] if row else "")
        return labels

    # ------------------------------------------------------------------
    # Core inference
    # ------------------------------------------------------------------
    def process_frame(self, base64_frame: str, mode: str = "hybrid") -> dict:
        """
        Decode a base64 JPEG frame, run MediaPipe + TFLite, return result dict.
        Routes logic based on selected mode ("static", "dynamic", "hybrid").
        """
        # Decode base64 → numpy image
        img_bytes = base64.b64decode(base64_frame)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        try:
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            logger.error(f"Image decode error: {e}")
            return self._empty_prediction()

        if frame is None:
            return self._empty_prediction()

        # Flip horizontally (mirror) first, since both static and dynamic expect user perspective
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Create MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        # Run HandLandmarker
        result = self.hand_landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return self._empty_prediction()

        h, w = frame_rgb.shape[:2]

        # Separate left/right hands
        right_lm_raw = None
        left_lm_raw = None

        for i, handedness_list in enumerate(result.handedness):
            # MediaPipe returns handedness as seen from camera (mirrored)
            hand_label = handedness_list[0].category_name
            if hand_label == "Right":
                right_lm_raw = result.hand_landmarks[i]
            elif hand_label == "Left":
                left_lm_raw = result.hand_landmarks[i]

        # If only one hand detected, use it as right fallback
        if right_lm_raw is None and left_lm_raw is None:
            right_lm_raw = result.hand_landmarks[0]

        left_list = left_lm_raw if left_lm_raw else []
        right_list = right_lm_raw if right_lm_raw else []

        # Collect all landmarks for frontend overlay (0-1 range)
        all_landmarks = []
        for hand_landmarks in result.hand_landmarks:
            for lm in hand_landmarks:
                all_landmarks.append({"x": lm.x, "y": lm.y})
                
        # Grab the latest pose landmarks from the dynamic service (populated during detection)
        current_pose_landmarks = getattr(self.dynamic_service, 'latest_pose_landmarks', [])

        # ------------------------------------------------------------------
        # Dynamic Mode Processing (Words/Phrases)
        # ------------------------------------------------------------------
        if mode in ["dynamic", "hybrid"]:
            dynamic_pred = self.dynamic_service.process_frame(frame_rgb)
            if dynamic_pred:
                logger.debug(f"[ROUTER] Emitting Dynamic Phrase: {dynamic_pred['word']}")
                return {
                    "gesture_id": -1, # Dynamic
                    "label": dynamic_pred["word"],
                    "word": dynamic_pred["word"],
                    "confidence": dynamic_pred["confidence"],
                    "landmarks": all_landmarks,
                    "pose_landmarks": current_pose_landmarks,
                    "type": "dynamic"
                }

        # ------------------------------------------------------------------
        # Static Mode Processing (Letters ONLY)
        # ------------------------------------------------------------------
        if mode in ["static", "hybrid"]:
            # Extract pixel landmarks for each hand
            right_features = self._extract_and_process(right_lm_raw, w, h) if right_lm_raw else [0.0] * FEATURES_PER_HAND
            left_features = self._extract_and_process(left_lm_raw, w, h) if left_lm_raw else [0.0] * FEATURES_PER_HAND
    
            # Concatenate both hands → 84 features
            combined_features = right_features + left_features
    
            # Classify via TFLite
            gesture_id = self.keypoint_classifier(combined_features)
    
            # Update Smoothing Buffer
            self.prediction_buffer.append(gesture_id)
            smoothed_id, confidence = self._get_smoothed_prediction()
    
            # Strict Stable Output: Emit letter only if it dominates 80% of window
            if confidence >= 0.8:
                smoothed_label = self.keypoint_labels[smoothed_id] if smoothed_id < len(self.keypoint_labels) else "Unknown"
                
                # In strict static mode, we only return the static prediction.
                # In hybrid mode, if dynamic didn't trigger, we fallback to static letter.
                return {
                    "gesture_id": int(smoothed_id),
                    "label": smoothed_label,
                    "word": smoothed_label,
                    "confidence": confidence,
                    "landmarks": all_landmarks,
                    "pose_landmarks": current_pose_landmarks,
                    "type": "static"
                }

        # If nothing triggered above the thresholds, return empty prediction but keep the skeleton active
        empty_pred = self._empty_prediction()
        empty_pred["landmarks"] = all_landmarks
        empty_pred["pose_landmarks"] = current_pose_landmarks
        return empty_pred
    # ------------------------------------------------------------------
    # Feature extraction per hand
    # ------------------------------------------------------------------
    def _extract_and_process(self, hand_landmarks, img_w, img_h) -> list:
        """Extract 21 landmarks → relative + normalized 42 features."""
        landmark_list = self._calc_landmark_list(hand_landmarks, img_w, img_h)
        return self._pre_process_landmark(landmark_list)

    @staticmethod
    def _calc_landmark_list(hand_landmarks, img_w, img_h) -> list:
        """Convert MediaPipe NormalizedLandmark list to pixel coordinate list."""
        landmark_list = []
        for lm in hand_landmarks:
            x = min(int(lm.x * img_w), img_w - 1)
            y = min(int(lm.y * img_h), img_h - 1)
            landmark_list.append([x, y])
        return landmark_list

    @staticmethod
    def _pre_process_landmark(landmark_list) -> list:
        """Convert landmarks to relative + normalized flat list (42 features)."""
        temp = copy.deepcopy(landmark_list)

        # Relative coordinates (origin = wrist)
        base_x, base_y = temp[0][0], temp[0][1]
        for point in temp:
            point[0] -= base_x
            point[1] -= base_y

        # Flatten to 1D
        temp = list(itertools.chain.from_iterable(temp))

        # Normalize
        max_val = max(map(abs, temp))
        if max_val == 0:
            return temp

        temp = [v / max_val for v in temp]
        return temp

    # ------------------------------------------------------------------
    # Prediction smoothing
    # ------------------------------------------------------------------
    def _get_smoothed_prediction(self) -> tuple:
        """Return (most_common_id, confidence) from the prediction buffer."""
        if not self.prediction_buffer:
            return 0, 0.0

        counter = Counter(self.prediction_buffer)
        most_common_id, count = counter.most_common(1)[0]
        confidence = count / len(self.prediction_buffer)

        return most_common_id, confidence

    def _empty_prediction(self) -> dict:
        """Returns a standardized empty prediction payload."""
        return {
            "gesture_id": -1,
            "label": "",
            "word": "",
            "confidence": 0.0,
            "landmarks": [],
            "pose_landmarks": getattr(self.dynamic_service, 'latest_pose_landmarks', []),
            "type": "none"
        }

