import cv2
import numpy as np
import os
import time
import mediapipe as mp
import copy
import itertools

# --- CONFIGURATION ---
DATA_PATH = os.path.join('MP_Data')
actions = np.array(['hello', 'thanks', 'iloveyou'])
no_sequences = 30     # Number of videos/samples per action
sequence_length = 30  # Frames per video

# Create directory structure
for action in actions: 
    for sequence in range(no_sequences):
        try: 
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
        except:
            pass

# --- FEATURE EXTRACTION HELPERS (Same as backend gesture_service) ---
def _calc_landmark_list(hand_landmarks, img_w, img_h):
    landmark_list = []
    for lm in hand_landmarks:
        # Avoid out of bounds
        x = min(int(lm.x * img_w), img_w - 1)
        y = min(int(lm.y * img_h), img_h - 1)
        landmark_list.append([x, y])
    return landmark_list

def _pre_process_landmark(landmark_list):
    temp = copy.deepcopy(landmark_list)
    base_x, base_y = temp[0][0], temp[0][1]
    for point in temp:
        point[0] -= base_x
        point[1] -= base_y
    temp = list(itertools.chain.from_iterable(temp))
    max_val = max(map(abs, temp))
    if max_val == 0:
        return temp
    temp = [v / max_val for v in temp]
    return temp

def extract_keypoints(result, img_w, img_h):
    right_lm_raw = None
    left_lm_raw = None

    if result.hand_landmarks:
        for i, handedness_list in enumerate(result.handedness):
            hand_label = handedness_list[0].category_name
            if hand_label == "Right":
                right_lm_raw = result.hand_landmarks[i]
            elif hand_label == "Left":
                left_lm_raw = result.hand_landmarks[i]
        
        if right_lm_raw is None and left_lm_raw is None:
            right_lm_raw = result.hand_landmarks[0]

    right_features = _pre_process_landmark(_calc_landmark_list(right_lm_raw, img_w, img_h)) if right_lm_raw else [0.0]*42
    left_features = _pre_process_landmark(_calc_landmark_list(left_lm_raw, img_w, img_h)) if left_lm_raw else [0.0]*42
    return np.concatenate([right_features, left_features])


# --- SETUP MEDIAPIPE ---
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'hand_landmarker.task'))),
    num_hands=2,
    running_mode=VisionRunningMode.IMAGE
)

print("Starting video capture...")
cap = cv2.VideoCapture(0) # Change to 1 if external camera

with HandLandmarker.create_from_options(options) as landmarker:
    # Loop through actions
    for action in actions:
        print(f"\n--- GET READY FOR: {action.upper()} ---")
        time.sleep(3)

        # Loop through sequences/videos
        for sequence in range(no_sequences):
            # Loop through video length
            for frame_num in range(sequence_length):

                ret, frame = cap.read()
                if not ret: continue

                # Mirror frame
                frame = cv2.flip(frame, 1)
                
                # Setup MP Image
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                
                # Detect
                results = landmarker.detect(mp_image)
                
                # Draw prompt on screen
                if frame_num == 0: 
                    cv2.putText(frame, 'STARTING COLLECTION', (120,200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255, 0), 4, cv2.LINE_AA)
                    cv2.putText(frame, f'Collecting frames for {action} Video Number {sequence}', (15,12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                    cv2.imshow('OpenCV Feed', frame)
                    cv2.waitKey(2000) # Give 2 sec break before action
                else: 
                    cv2.putText(frame, f'Collecting frames for {action} Video Number {sequence}', (15,12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                    cv2.imshow('OpenCV Feed', frame)

                # Export keypoints
                h, w = frame.shape[:2]
                keypoints = extract_keypoints(results, w, h)
                
                # Save as numpy array (.npy)
                npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
                np.save(npy_path, keypoints)

                # Break gracefully
                if cv2.waitKey(10) & 0xFF == ord('q'):
                    cap.release()
                    cv2.destroyAllWindows()
                    exit()

cap.release()
cv2.destroyAllWindows()
print("Collection Complete!")
