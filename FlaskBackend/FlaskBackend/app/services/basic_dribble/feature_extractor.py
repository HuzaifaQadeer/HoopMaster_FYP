import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import os

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# Load the YOLO model (assuming the model file is in the static folder)
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
model_path = os.path.join(base_dir, 'app','static', 'yolov8n_basketball.pt')
print("Loading YOLO model from:", model_path)  # Debug print; remove later.
ball_detector = YOLO(model_path)

def calculate_angle(a, b, c):
    ab = a - b
    cb = c - b
    dot_ = np.dot(ab, cb)
    mag  = (np.linalg.norm(ab) * np.linalg.norm(cb)) + 1e-6
    cos_ = dot_ / mag
    return np.degrees(np.arccos(np.clip(cos_, -1, 1)))

def get_ball_coords(yolo_result):
    for box in yolo_result.boxes:
        cls_id = int(box.cls)
        class_name = ball_detector.names[cls_id]
        if class_name == 'ball':
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
            return (cx, cy)
    return None

def extract_features(frame):
    pose_results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not pose_results.pose_landmarks:
        return None, None

    # YOLO detection for the ball with a confidence threshold
    yolo_res = ball_detector.predict(frame, conf=0.35, verbose=False)[0]
    ball_xy  = get_ball_coords(yolo_res)

    h, w, _ = frame.shape
    def gc(lm):
        return np.array([lm.x * w, lm.y * h])

    mp_lm = pose_results.pose_landmarks.landmark
    l_shoulder = gc(mp_lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value])
    l_hip      = gc(mp_lm[mp_pose.PoseLandmark.LEFT_HIP.value])
    l_knee     = gc(mp_lm[mp_pose.PoseLandmark.LEFT_KNEE.value])
    l_ankle    = gc(mp_lm[mp_pose.PoseLandmark.LEFT_ANKLE.value])
    r_hip      = gc(mp_lm[mp_pose.PoseLandmark.RIGHT_HIP.value])

    back_angle = calculate_angle(l_shoulder, l_hip, l_knee)
    knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
    waist_y    = (l_hip[1] + r_hip[1]) / 2

    feats = {
      "back_angle": back_angle,
      "knee_angle": knee_angle,
      "waist_level": waist_y,
      "pose_landmarks": pose_results.pose_landmarks
    }
    return feats, ball_xy
