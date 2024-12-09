import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
from pathlib import Path

# Optimize MediaPipe configuration
pose = mp.solutions.pose.Pose(
    min_detection_confidence=0.5,  # Reduce from default 0.7
    min_tracking_confidence=0.5,   # Reduce from default 0.7
    model_complexity=0            # Use lightweight model (0 instead of 1)
)

# Load model once and configure for faster inference
model_path = Path(__file__).parent.parent.parent / 'static' / 'models' / 'yolov8n_basketball.pt'
ball_detector = YOLO(str(model_path))
ball_detector.conf = 0.5  # Lower confidence threshold
ball_detector.iou = 0.45  # Slightly lower IoU threshold

def extract_features(frame):
    """
    Extract features from a single frame.
    """
    # Resize frame for faster processing
    height, width = frame.shape[:2]
    if width > 640:  # Only resize if larger than 640px
        frame = cv2.resize(frame, (640, int(640 * height/width)))
    
    # Convert to RGB only once
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Process the frame with MediaPipe Pose
    pose_results = pose.process(rgb_frame)
    if not pose_results.pose_landmarks:
        return None

    # Use smaller inference size for YOLO
    yolo_results = ball_detector.predict(rgb_frame, imgsz=416, verbose=False)[0]
    ball_coords = get_ball_coordinates(yolo_results)
    if ball_coords is None:
        return None

    features = calculate_features(pose_results.pose_landmarks, frame.shape, ball_coords)
    return features

def get_ball_coordinates(yolo_results):
    for box in yolo_results.boxes:
        cls_id = int(box.cls)
        class_name = ball_detector.names[cls_id]
        if class_name == 'ball':
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            return [(x1 + x2) / 2, (y1 + y2) / 2]
    return None

def calculate_features(landmarks, image_shape, ball_coords):
    image_height, image_width, _ = image_shape

    def get_coords(landmark):
        return np.array([landmark.x * image_width, landmark.y * image_height])

    # Extract relevant landmarks
    left_shoulder = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER])
    right_shoulder = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER])
    left_hip = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.LEFT_HIP])
    right_hip = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.RIGHT_HIP])
    left_knee = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.LEFT_KNEE])
    left_ankle = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.LEFT_ANKLE])
    right_ankle = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.RIGHT_ANKLE])
    nose = get_coords(landmarks.landmark[mp.solutions.pose.PoseLandmark.NOSE])

    # Calculate derived positions
    neck = (left_shoulder + right_shoulder) / 2
    mid_hip = (left_hip + right_hip) / 2
    torso_vector = neck - mid_hip
    head_vector = nose - neck

    # Calculate angles and measurements
    head_tilt_angle = calculate_angle_between_vectors(torso_vector, head_vector)
    back_angle = calculate_angle(left_shoulder, left_hip, left_knee)
    knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
    leg_width = np.linalg.norm(left_ankle - right_ankle) / image_width

    # Calculate levels and normalize
    waist_level = (left_hip[1] + right_hip[1]) / 2
    shoulder_level = (left_shoulder[1] + right_shoulder[1]) / 2
    normalized_ball_y = ball_coords[1] / image_height
    normalized_waist_y = waist_level / image_height
    normalized_shoulder_y = shoulder_level / image_height
    waist_to_shoulder_distance = normalized_waist_y - normalized_shoulder_y
    margin = waist_to_shoulder_distance * 0.2

    return {
        'back_angle': back_angle,
        'knee_angle': knee_angle,
        'head_tilt_angle': head_tilt_angle,
        'leg_width': leg_width,
        'normalized_ball_y': normalized_ball_y,
        'normalized_waist_y': normalized_waist_y,
        'margin': margin
    }

def calculate_angle(a, b, c):
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / ((np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def calculate_angle_between_vectors(v1, v2):
    dot_product = np.dot(v1, v2)
    magnitude_product = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-6
    cosine_angle = dot_product / magnitude_product
    angle_rad = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle_rad)