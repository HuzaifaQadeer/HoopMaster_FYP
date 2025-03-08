# drills/crossover_dribble/feature_extractor.py

import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

def extract_features(frame):
    """
    Extract features from a single frame.
    """
    pose_results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not pose_results.pose_landmarks:
        return None

    features = calculate_features(pose_results.pose_landmarks, frame.shape)
    features['pose_landmarks'] = pose_results.pose_landmarks  # Include pose landmarks for drawing
    return features

def calculate_features(landmarks, image_shape):
    """
    Calculate relevant features from landmarks.
    """
    image_height, image_width, _ = image_shape

    # Helper function to get coordinates
    def get_coords(landmark):
        return np.array([landmark.x * image_width, landmark.y * image_height])

    # Extract relevant landmarks
    left_shoulder = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER])
    right_shoulder = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER])
    left_wrist = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST])
    right_wrist = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST])
    left_hip = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP])
    right_hip = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP])
    left_knee = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE])
    right_knee = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE])
    left_ankle = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE])
    right_ankle = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE])

    mid_hip = (left_hip + right_hip) / 2
    mid_shoulder = (left_shoulder + right_shoulder) / 2
    torso_vector = mid_shoulder - mid_hip
    vertical_vector = np.array([0, -1])  # Upward vertical vector
    forward_lean_angle = calculate_angle_between_vectors(torso_vector, vertical_vector)

    left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
    right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
    average_knee_angle = (left_knee_angle + right_knee_angle) / 2


    leg_separation = np.linalg.norm(left_ankle - right_ankle)
    hip_width = np.linalg.norm(left_hip - right_hip)
    normalized_leg_separation = leg_separation / hip_width  # Normalized to hip width


    features = {
        'forward_lean_angle': forward_lean_angle,
        'average_knee_angle': average_knee_angle,
        'normalized_leg_separation': normalized_leg_separation,
        'left_wrist': left_wrist,
        'right_wrist': right_wrist,
        'left_shoulder': left_shoulder,
        'right_shoulder': right_shoulder,

    }
    return features

def calculate_angle(a, b, c):
    """
    Calculate the angle at point b given three points a, b, c.
    """
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / ((np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-6)
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

def calculate_angle_between_vectors(v1, v2):
    """
    Calculate the angle between two vectors in degrees.
    """
    dot_product = np.dot(v1, v2)
    magnitude_product = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-6
    cosine_angle = dot_product / magnitude_product
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle
