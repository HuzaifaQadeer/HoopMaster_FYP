import cv2
import os
import time
import subprocess
import numpy as np
import mediapipe as mp
from ultralytics import YOLO

# Initialize MediaPipe Pose and YOLO for ball detection.
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
# Load YOLO model from your static folder.
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
model_path = os.path.join(base_dir, 'app','static', 'yolov8n_basketball.pt')
ball_detector = YOLO(model_path)

# ---------------------------
# Utility Functions
# ---------------------------
def calculate_angle(a, b, c):
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / ((np.linalg.norm(ba)*np.linalg.norm(bc)) + 1e-6)
    return np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))

def calculate_angle_between_vectors(v1, v2):
    dot_product = np.dot(v1, v2)
    magnitude_product = (np.linalg.norm(v1)*np.linalg.norm(v2)) + 1e-6
    return np.degrees(np.arccos(np.clip(dot_product/magnitude_product, -1.0, 1.0)))

# ---------------------------
# Feature Extraction
# ---------------------------
def get_ball_coordinates(yolo_results):
    # Lower confidence threshold to 0.25
    for box in yolo_results.boxes:
        cls_id = int(box.cls)
        class_name = ball_detector.names[cls_id]
        if class_name == 'ball':
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            return np.array([(x1+x2)/2, (y1+y2)/2])
    return None

def calculate_features(landmarks, image_shape):
    image_height, image_width, _ = image_shape
    def get_coords(landmark):
        return np.array([landmark.x * image_width, landmark.y * image_height])
    left_hip = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP])
    right_hip = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP])
    left_knee = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE])
    right_knee = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE])
    left_foot = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_FOOT_INDEX])
    right_foot = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX])
    left_shoulder = get_coords(landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER])
    right_shoulder = get_coords(landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER])
    mid_hip = (left_hip + right_hip) / 2
    mid_shoulder = (left_shoulder + right_shoulder) / 2
    torso_vector = mid_shoulder - mid_hip
    vertical_vector = np.array([0, -1])
    forward_lean_angle = calculate_angle_between_vectors(torso_vector, vertical_vector)
    left_knee_angle = calculate_angle(left_hip, left_knee, left_foot)
    right_knee_angle = calculate_angle(right_hip, right_knee, right_foot)
    average_knee_angle = (left_knee_angle + right_knee_angle) / 2
    features = {
        'left_hip': left_hip,
        'right_hip': right_hip,
        'left_knee': left_knee,
        'right_knee': right_knee,
        'left_foot': left_foot,
        'right_foot': right_foot,
        'mid_hip': mid_hip,
        'forward_lean_angle': forward_lean_angle,
        'average_knee_angle': average_knee_angle,
        'left_knee_angle': left_knee_angle,
        'right_knee_angle': right_knee_angle,
        'landmarks': landmarks
    }
    return features

def extract_features(frame):
    pose_results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not pose_results.pose_landmarks:
        return None, None
    yolo_results = ball_detector.predict(frame, conf=0.25, verbose=False)[0]
    ball_coords = get_ball_coordinates(yolo_results)
    features = calculate_features(pose_results.pose_landmarks, frame.shape)
    return features, ball_coords

# ---------------------------
# Evaluation (Using Stable Lead Foot)
# ---------------------------
def evaluate_frame(features, ball_coords, lead_foot):
    results = {}
    forward_lean_angle = features['forward_lean_angle']
    # Use relaxed thresholds: knee bend threshold 165° and forward lean threshold 8°.
    if lead_foot == 'left':
        if features['left_knee_angle'] < 165 and forward_lean_angle > 8:
            results['Posture'] = 'Good'
        else:
            results['Posture'] = 'Bend more and lean towards left'
    elif lead_foot == 'right':
        if features['right_knee_angle'] < 165 and forward_lean_angle > 8:
            results['Posture'] = 'Good'
        else:
            results['Posture'] = 'Bend more and lean towards right'
    else:
        results['Posture'] = 'No proper lead foot. Bend and step forward.'

    # Evaluate ball height relative to thighs.
    if ball_coords is not None:
        if lead_foot == 'left':
            hip_y = features['left_hip'][1]
            knee_y = features['left_knee'][1]
        elif lead_foot == 'right':
            hip_y = features['right_hip'][1]
            knee_y = features['right_knee'][1]
        else:
            hip_y = (features['left_hip'][1] + features['right_hip'][1]) / 2
            knee_y = (features['left_knee'][1] + features['right_knee'][1]) / 2
        thigh_level = (hip_y + knee_y) / 2
        ball_y = ball_coords[1]
        if ball_y > thigh_level:
            results['Ball Height'] = 'Good'
        else:
            results['Ball Height'] = 'Keep the ball lower'
    else:
        results['Ball Height'] = 'Ball not detected'

    return results

# ---------------------------
# Overlay Evaluation on Frame
# ---------------------------
def overlay_evaluation(frame, features, ball_coords, results):
    annotated_frame = frame.copy()
    if features is not None and 'landmarks' in features:
        mp_drawing = mp.solutions.drawing_utils
        mp_drawing.draw_landmarks(
            annotated_frame,
            features['landmarks'],
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2),
            connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2)
        )
    if ball_coords is not None:
        cv2.circle(annotated_frame, (int(ball_coords[0]), int(ball_coords[1])), 10, (0, 0, 255), -1)
    y_offset = 30
    for key, value in results.items():
        text = f"{key}: {value}"
        color = (0, 255, 0) if str(value).lower() == 'good' else (0, 0, 255)
        cv2.putText(annotated_frame, text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        y_offset += 30
    return annotated_frame

# ---------------------------
# Video Compression
# ---------------------------
def compress_video(input_path, output_path):
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
# Video Processing
# ---------------------------
def process_video_file(video_path, output_folder):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Could not open video file.")
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    out_filename = f"{base_name}_annotated_{int(time.time())}.mp4"
    out_path = os.path.join(output_folder, out_filename)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps_in = cap.get(cv2.CAP_PROP_FPS)
    if fps_in <= 0:
        fps_in = 24
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out_writer = cv2.VideoWriter(out_path, fourcc, fps_in, (width, height), True)
    processing_interval = 5  # Process every 5th frame.
    frame_count = 0
    last_player_time = time.time()
    last_ball_time = time.time()
    last_features = None
    last_ball_coords = None
    last_results = {}
    total_eval_frames = 0
    good_posture_count = 0
    good_ball_count = 0

    # Variables for stable lead foot determination.
    stable_lead_foot = None
    candidate_change_count = 0
    LEAD_CHANGE_THRESHOLD = 5
    foot_forward_threshold = 30.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        current_time = time.time()
        if frame_count % processing_interval == 1:
            features, ball_coords = extract_features(frame)
            # Check detection timeouts.
            if features is None:
                if current_time - last_player_time >= 3:
                    print("No player detected for 3 seconds. Ending process.")
                    break
            else:
                last_player_time = current_time
            if ball_coords is None:
                if current_time - last_ball_time >= 3:
                    print("No ball detected for 3 seconds. Ending process.")
                    break
            else:
                last_ball_time = current_time
            if features is not None:
                # Determine candidate lead foot.
                candidate_lead = None
                if abs(features['left_knee_angle'] - features['right_knee_angle']) > 5:
                    candidate_lead = 'left' if features['left_knee_angle'] < features['right_knee_angle'] else 'right'
                else:
                    if abs(features['left_foot'][1] - features['right_foot'][1]) > foot_forward_threshold:
                        candidate_lead = 'left' if features['left_foot'][1] > features['right_foot'][1] else 'right'
                if stable_lead_foot is None:
                    stable_lead_foot = candidate_lead
                    candidate_change_count = 0
                elif candidate_lead is not None and candidate_lead != stable_lead_foot:
                    candidate_change_count += 1
                    if candidate_change_count >= LEAD_CHANGE_THRESHOLD:
                        stable_lead_foot = candidate_lead
                        candidate_change_count = 0
                else:
                    candidate_change_count = 0

                results = evaluate_frame(features, ball_coords, stable_lead_foot)
                last_features = features
                last_ball_coords = ball_coords
                last_results = results

                total_eval_frames += 1
                if results.get('Posture', '').lower() == 'good':
                    good_posture_count += 1
                if results.get('Ball Height', '').lower() == 'good':
                    good_ball_count += 1
            else:
                features = last_features
                ball_coords = last_ball_coords
                results = last_results
        else:
            features = last_features
            ball_coords = last_ball_coords
            results = last_results

        annotated_frame = overlay_evaluation(frame, features, ball_coords, results)
        out_writer.write(annotated_frame)

    cap.release()
    out_writer.release()

    if total_eval_frames == 0:
        final_feedback = "No player or ball found."
    else:
        posture_score = (good_posture_count / total_eval_frames) * 10
        ball_score = (good_ball_count / total_eval_frames) * 10
        overall_score = (posture_score + ball_score) / 2
        feedback_lines = [
            f"Posture Score: {posture_score:.1f}/10",
            f"Ball Control Score: {ball_score:.1f}/10",
            f"Overall Score: {overall_score:.1f}/10"
        ]
        suggestions = []
        if posture_score < 7:
            suggestions.append("Improve your posture.")
        if ball_score < 7:
            suggestions.append("Keep the ball at the correct height.")
        if overall_score >= 7:
            suggestions.append("Great job!")
        else:
            suggestions.append("Keep practicing to improve.")
        feedback_lines.append("Feedback: " + " ".join(suggestions))
        final_feedback = "\n".join(feedback_lines)

    # Compress the annotated video.
    compressed_filename = f"{base_name}_annotated_compressed_{int(time.time())}.mp4"
    compressed_out_path = os.path.join(output_folder, compressed_filename)
    compress_video(out_path, compressed_out_path)
    print(f"Compressed annotated video saved at: {compressed_out_path}")

    if os.path.exists(out_path):
        os.remove(out_path)

    return compressed_out_path, final_feedback

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    return process_video_file(input_path, output_folder)
