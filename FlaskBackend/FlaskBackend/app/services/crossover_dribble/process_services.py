import cv2
import os
import time
import subprocess
import mediapipe as mp
from app.services.crossover_dribble.feature_extractor import extract_features
from app.services.crossover_dribble.evaluator import evaluate_frame

def overlay_evaluation(frame, features, results):
    annotated_frame = frame.copy()
    if features and 'pose_landmarks' in features:
        mp_drawing = mp.solutions.drawing_utils
        mp_pose = mp.solutions.pose
        mp_drawing.draw_landmarks(
            annotated_frame,
            features['pose_landmarks'],
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2),
            connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2)
        )
    y_offset = 30
    for key, value in results.items():
        text = f"{key}: {value}"
        color = (0, 255, 0) if 'good' in str(value).lower() else (0, 0, 255)
        cv2.putText(annotated_frame, text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        y_offset += 30
    return annotated_frame

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
        fps_in = 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out_writer = cv2.VideoWriter(out_path, fourcc, fps_in, (w, h), True)

    # Initialize evaluator state.
    switch_times = []
    previous_hand_side = None
    hand_side_history = []
    last_results = {}
    last_features = None
    last_ball_xy = None

    frame_count = 0
    processing_interval = 5  # Process every 5th frame.
    last_detection_time = time.time()
    no_detection_reason = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        frame_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

        if frame_count % processing_interval == 1:
            features, ball_xy = extract_features(frame)
            # If no pose features or no ball detected, check timeout.
            if (features is None or ball_xy is None):
                if (last_features is None or last_ball_xy is None) and (time.time() - last_detection_time >= 3):
                    no_detection_reason = "No ball or player detected for 3 seconds. Stopping processing."
                    break
                else:
                    features = last_features
                    ball_xy = last_ball_xy
            else:
                last_detection_time = time.time()
                last_features = features
                last_ball_xy = ball_xy

            if features is not None:
                # Pass the tuple (features, ball_xy) to evaluator.
                results, switch_times, previous_hand_side, hand_side_history = evaluate_frame(
                    (features, ball_xy), frame_time, switch_times, previous_hand_side, hand_side_history
                )
                # If evaluator flags no ball detected, break.
                if results.get("Ball Switch") == "No ball detected":
                    no_detection_reason = "No ball detected for 3 seconds. Stopping processing."
                    break
                last_results = results
            else:
                results = last_results
        else:
            features = last_features
            results = last_results

        annotated = overlay_evaluation(frame, features, results)
        out_writer.write(annotated)

    cap.release()
    out_writer.release()

    if no_detection_reason is not None:
        print(no_detection_reason)
        if os.path.exists(out_path):
            os.remove(out_path)
        return None, "Upload a proper video. No ball or player found."

    # Calculate textual evaluation.
    body_text = last_results.get("Body Lean", "").strip().lower()
    foot_text = last_results.get("Foot Placement", "").strip().lower()
    switch_text = last_results.get("Ball Switch", "").strip().lower()

    body_score = 10 if body_text == "good" else 0
    foot_score = 10 if foot_text == "good" else 0
    try:
        parts = switch_text.split()
        x_part = parts[1].replace(",", "")  # Expected format "X/15"
        switch_count = float(x_part.split("/")[0])
        ball_score = (switch_count / 15) * 10
    except Exception:
        ball_score = 0

    overall_score = (body_score + foot_score + ball_score) / 3.0

    feedback_lines = [
        f"Body Lean: {body_score:.1f}/10",
        f"Foot Placement: {foot_score:.1f}/10",
        f"Ball Switch: {ball_score:.1f}/10",
        f"Overall Score: {overall_score:.1f}/10"
    ]
    suggestions = []
    if body_score < 7:
        suggestions.append("Improve your body lean posture.")
    if foot_score < 7:
        suggestions.append("Adjust knee bend and leg separation for better foot placement.")
    if ball_score < 7:
        suggestions.append("Increase your ball switching speed.")
    if not suggestions:
        suggestions.append("Great job! Keep up the good work.")
    evaluation_text = "\n".join(feedback_lines) + "\nFeedback: " + " ".join(suggestions)

    # Compress the annotated video.
    compressed_filename = f"{base_name}_annotated_compressed_{int(time.time())}.mp4"
    compressed_out_path = os.path.join(output_folder, compressed_filename)
    compress_video(out_path, compressed_out_path)
    print(f"Compressed annotated video saved at: {compressed_out_path}")

    if os.path.exists(out_path):
        os.remove(out_path)

    return compressed_out_path, evaluation_text

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    return process_video_file(input_path, output_folder)
