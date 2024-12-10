import mediapipe as mp
import cv2
import numpy as np
import os

from ultralytics import YOLO

# Get the current file's directory and construct the correct path
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))), 'app', 'static', 'yolov8n_basketball.pt')

# Load the YOLO model for ball detection
ball_detector = YOLO(model_path)

def extract_features(frame):
    """
    Extract features from a single frame.
    """
    # Process the frame with MediaPipe Pose
    pose = mp.solutions.pose.Pose()
    pose_results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not pose_results.pose_landmarks:
        return None

    # Detect the ball using YOLOv8
    yolo_results = ball_detector.predict(frame, verbose=False)[0]
    ball_coords = get_ball_coordinates(yolo_results)
    if ball_coords is None:
        return None

    # Calculate features
    features = calculate_features(pose_results.pose_landmarks, frame.shape, ball_coords)
    return features

def get_ball_coordinates(yolo_results):
    """
    Extract ball coordinates from YOLOv8 detections.
    """
    for box in yolo_results.boxes:
        cls_id = int(box.cls)
        class_name = ball_detector.names[cls_id]
        if class_name == 'ball':  # Replace with your class name
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            # Return the center coordinates of the ball
            return [(x1 + x2) / 2, (y1 + y2) / 2]
    return None

def calculate_features(landmarks, image_shape, ball_coords):
    """
    Calculate relevant features from landmarks and ball coordinates.
    """
    image_height, image_width, _ = image_shape

    # Helper function to get coordinates
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

    # Calculate neck position (midpoint between shoulders)
    neck = (left_shoulder + right_shoulder) / 2

    # Calculate mid-hip position (pelvis)
    mid_hip = (left_hip + right_hip) / 2

    # Calculate torso vector (from mid-hip to neck)
    torso_vector = neck - mid_hip

    # Calculate head vector (from neck to nose)
    head_vector = nose - neck

    # Calculate head tilt angle relative to torso
    head_tilt_angle = calculate_angle_between_vectors(torso_vector, head_vector)

    # Calculate back angle (using left side for consistency)
    back_angle = calculate_angle(left_shoulder, left_hip, left_knee)

    # Calculate knee angle
    knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

    # Calculate leg width
    leg_width = np.linalg.norm(left_ankle - right_ankle) / image_width

    # Calculate waist level
    waist_level = (left_hip[1] + right_hip[1]) / 2

    # Calculate shoulder level
    shoulder_level = (left_shoulder[1] + right_shoulder[1]) / 2

    # Normalize coordinates
    normalized_ball_y = ball_coords[1] / image_height
    normalized_waist_y = waist_level / image_height
    normalized_shoulder_y = shoulder_level / image_height

    # Calculate margin for ball height
    waist_to_shoulder_distance = normalized_waist_y - normalized_shoulder_y
    margin = waist_to_shoulder_distance * 0.2  # Adjust as needed

    # Package features
    features = {
        'back_angle': back_angle,
        'knee_angle': knee_angle,
        'head_tilt_angle': head_tilt_angle,
        'leg_width': leg_width,
        'normalized_ball_y': normalized_ball_y,
        'normalized_waist_y': normalized_waist_y,
        'margin': margin
    }
    return features

def calculate_angle(a, b, c):
    """
    Calculate the angle between three points (in degrees).
    """
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / ((np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def calculate_angle_between_vectors(v1, v2):
    """
    Calculate the angle between two vectors (in degrees).
    """
    dot_product = np.dot(v1, v2)
    magnitude_product = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-6
    cosine_angle = dot_product / magnitude_product
    angle_rad = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle_rad)
