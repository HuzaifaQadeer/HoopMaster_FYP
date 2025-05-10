import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import os
import torch
import math

# Check if CUDA is available
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {device}")

# Initialize MediaPipe Pose with optimized settings
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=2,  # Use the most complex model for better accuracy
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Configure MediaPipe to use GPU
mp.solutions.pose.Pose._POSE_GRAPH = 'pose_landmarker_heavy.task'
mp.solutions.pose.Pose._POSE_GRAPH_GPU = 'pose_landmarker_heavy_gpu.task'

# Load the YOLO model (assuming the model file is in the static folder)
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
model_path = os.path.join(base_dir, 'app','static', 'yolov8n_basketball.pt')
print("Loading YOLO model from:", model_path)  # Debug print; remove later.
ball_detector = YOLO(model_path).to(device)  # Move model to GPU

# Pre-allocate CUDA tensors for better performance
def calculate_angle(a, b, c):
    # Convert inputs to CUDA tensors if they aren't already
    if not isinstance(a, torch.Tensor):
        a = torch.tensor(a, device=device)
    if not isinstance(b, torch.Tensor):
        b = torch.tensor(b, device=device)
    if not isinstance(c, torch.Tensor):
        c = torch.tensor(c, device=device)
    
    ab = a - b
    cb = c - b
    dot_ = torch.dot(ab, cb)
    mag = (torch.norm(ab) * torch.norm(cb)) + 1e-6
    cos_ = dot_ / mag
    # Convert radians to degrees manually
    angle_rad = torch.arccos(torch.clamp(cos_, -1, 1))
    angle_deg = angle_rad * (180.0 / math.pi)
    return angle_deg.item()

def get_ball_coords(yolo_result):
    for box in yolo_result.boxes:
        cls_id = int(box.cls)
        class_name = ball_detector.names[cls_id]
        if class_name == 'ball':
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()  # Move tensor to CPU before converting to numpy
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
            return (cx, cy)
    return None

def extract_features(frame):
    # Convert frame to RGB for MediaPipe
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Process frame with MediaPipe
    pose_results = pose.process(frame_rgb)
    if not pose_results.pose_landmarks:
        return None, None

    # YOLO detection for the ball with a confidence threshold
    yolo_res = ball_detector.predict(frame, conf=0.35, verbose=False, device=device)[0]
    ball_xy = get_ball_coords(yolo_res)

    h, w, _ = frame.shape
    def gc(lm):
        return torch.tensor([lm.x * w, lm.y * h], device=device)

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
