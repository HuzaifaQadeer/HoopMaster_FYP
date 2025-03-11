import cv2
import mediapipe as mp
import numpy as np
import math
import time
import os
import subprocess
from ultralytics import YOLO

# ---------------------------
# Model and Mediapipe Initialization
# ---------------------------
# Load YOLOv8 basketball detection model.
# (Assumes the model is in your static folder – adjust path if needed)
# Load YOLO model from your static folder.
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
model_path = os.path.join(base_dir, 'app','static', 'yolov8n_basketball.pt')
yolo_model = YOLO(model_path)
# Initialize Mediapipe Pose.
mp_pose = mp.solutions.pose
pose_detector = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

# ---------------------------
# Utility Functions
# ---------------------------
def calculate_angle(a, b, c):
    """
    Calculates the angle (in degrees) at point b given three points a, b, and c.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / ((np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-8)
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

def compress_video(input_path, output_path):
    """
    Compress the video by reducing its bitrate so that the target file size is roughly 1/10th of the original.
    FPS is preserved to ensure smooth playback.
    """
    original_size_bytes = os.path.getsize(input_path)
    original_size_mb = original_size_bytes / (1024 * 1024)
    target_size_mb = original_size_mb / 10

    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frame_count / fps if fps > 0 else 1
    cap.release()

    target_size_bits = target_size_mb * 1024 * 1024 * 8
    video_bitrate = target_size_bits / duration
    video_bitrate_k = int(video_bitrate / 1000)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-b:v", f"{video_bitrate_k}k",
        "-r", str(fps),
        output_path
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# ---------------------------
# Main Processing Function
# ---------------------------
def process_behind_back_dribble(video_path, output_video_path):
    """
    Processes the input video to analyze a behind-the-back dribble.
    Evaluation criteria:
      - Knees should be bent (each knee angle < 170°).
      - The ball's height should be at or below shoulder level.
      - If no player or ball is detected continuously for 3 seconds, processing stops early.
    An annotated video is generated, then compressed (bitrate reduced to ~1/10th the original size).
    The uncompressed annotated video is deleted.
    Returns a tuple: (compressed_video_path, final_feedback).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, "Error opening video file."

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 24
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    # Evaluation counters and timeout tracking.
    person_detected_count = 0
    valid_knee_count = 0
    valid_ball_count = 0
    ball_detected_count = 0

    last_person_time = time.time()
    last_ball_time = time.time()
    ABSENCE_THRESHOLD = 3.0  # seconds

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        current_time = time.time()
        frame_feedback = []  # For overlay messages

        # Process pose using Mediapipe.
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose_detector.process(image_rgb)
        if results.pose_landmarks is None:
            frame_feedback.append("No person detected.")
            if current_time - last_person_time >= ABSENCE_THRESHOLD:
                print("No player detected for over 3 seconds. Ending process.")
                break
        else:
            last_person_time = current_time
            person_detected_count += 1

            def get_point(landmark):
                return (int(landmark.x * width), int(landmark.y * height))
            landmarks = results.pose_landmarks.landmark
            left_shoulder = get_point(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value])
            right_shoulder = get_point(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value])
            left_hip = get_point(landmarks[mp_pose.PoseLandmark.LEFT_HIP.value])
            right_hip = get_point(landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value])
            left_knee = get_point(landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value])
            right_knee = get_point(landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value])
            left_ankle = get_point(landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value])
            right_ankle = get_point(landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value])

            left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
            right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
            if left_knee_angle < 170 and right_knee_angle < 170:
                valid_knee_count += 1
                frame_feedback.append("Good knee bend.")
            else:
                frame_feedback.append("Knees not bent enough.")

        # Detect ball using YOLO.
        ball_detection = detect_ball(frame)
        if ball_detection[0] is None:
            frame_feedback.append("Ball not detected; assuming proper dribble.")
            if current_time - last_ball_time >= ABSENCE_THRESHOLD:
                print("No ball detected for over 3 seconds. Ending process.")
                break
            valid_ball = True  # When ball is missing, assume proper dribble by default.
        else:
            last_ball_time = current_time
            ball_detected_count += 1
            ball_bbox, ball_confidence = ball_detection
            ball_x, ball_y, ball_w, ball_h = ball_bbox
            ball_center = (ball_x + ball_w // 2, ball_y + ball_h // 2)
            if results.pose_landmarks is not None:
                shoulder_min_y = min(left_shoulder[1], right_shoulder[1])
            else:
                shoulder_min_y = 0
            if ball_center[1] >= shoulder_min_y:
                valid_ball = True
                frame_feedback.append("Ball height is appropriate.")
            else:
                valid_ball = False
                frame_feedback.append("Ball height too high.")
            cv2.rectangle(frame, (ball_x, ball_y), (ball_x+ball_w, ball_y+ball_h), (0, 255, 0), 2)
            cv2.circle(frame, ball_center, 5, (0, 0, 255), -1)
        if valid_ball:
            valid_ball_count += 1

        # Draw pose landmarks.
        if results.pose_landmarks is not None:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            cv2.putText(frame, f"L Knee: {int(left_knee_angle)}", left_knee,
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,0), 2)
            cv2.putText(frame, f"R Knee: {int(right_knee_angle)}", right_knee,
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,0), 2)

        # Overlay feedback messages.
        y0 = 30
        for i, msg in enumerate(frame_feedback):
            cv2.putText(frame, msg, (10, y0 + i*25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)
        out.write(frame)

    cap.release()
    out.release()

    # Final Textual Analysis.
    if person_detected_count == 0:
        final_feedback = "No player was detected in the video. Please ensure the player is clearly visible."
    else:
        posture_score = min((valid_knee_count / person_detected_count) * 10, 10)
        if ball_detected_count > 0:
            ball_score = min((valid_ball_count / ball_detected_count) * 10, 10)
        else:
            ball_score = 10
        overall_score = min((posture_score + ball_score) / 2, 10)
        feedback_lines = [
            f"Posture Score: {posture_score:.1f}/10",
            f"Ball Control Score: {ball_score:.1f}/10",
            f"Overall Score: {overall_score:.1f}/10"
        ]
        suggestions = []
        if posture_score < 7:
            suggestions.append("Focus on keeping your knees bent for better balance.")
        if ball_score < 7:
            suggestions.append("Work on maintaining a consistent ball height during your dribble.")
        if overall_score >= 7:
            suggestions.append("Great job!")
        else:
            suggestions.append("Keep practicing to improve your technique.")
        feedback_lines.append("Feedback: " + " ".join(suggestions))
        final_feedback = "\n".join(feedback_lines)

    # Compress the annotated video.
    compressed_filename = f"{base_name}_annotated_compressed_{int(time.time())}.mp4"
    compressed_out_path = os.path.join(os.path.dirname(output_video_path), compressed_filename)
    compress_video(output_video_path, compressed_out_path)
    print("Final Analysis:")
    print(final_feedback)
    print(f"Compressed annotated video saved at: {compressed_out_path}")

    if os.path.exists(output_video_path):
        os.remove(output_video_path)

    return compressed_out_path, final_feedback

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    # Create a unique output file for the annotated video.
    output_filename = f"behind_back_dribble_annotated_{int(time.time())}.mp4"
    output_video_path = os.path.join(output_folder, output_filename)
    return process_behind_back_dribble(video_path=input_path, output_video_path=output_video_path)
