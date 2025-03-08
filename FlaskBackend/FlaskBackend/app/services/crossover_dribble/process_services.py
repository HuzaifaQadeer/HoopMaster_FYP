import cv2
import os
import time
import subprocess
import mediapipe as mp
from app.services.crossover_dribble.feature_extractor import extract_features
from app.services.crossover_dribble.evaluator import evaluate_frame

def overlay_evaluation(frame, features, results):
    """
    Overlay the evaluation results onto the frame.
    """
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
        # If the result contains 'Good' (case-insensitive) assume it's positive.
        color = (0, 255, 0) if 'good' in str(value).lower() else (0, 0, 255)
        cv2.putText(
            annotated_frame, text, (10, y_offset),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2
        )
        y_offset += 30
    return annotated_frame

def compress_video(input_path, output_path):
    """
    Compress the video by reducing its bitrate based on the size of the input file.
    The target size is set to roughly 1/10th of the original file size.
    The FPS is kept consistent.
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
        "-y",  # Overwrite output file if it exists
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

    # Initialize evaluator state variables for crossover dribble.
    switch_times = []
    previous_hand_side = None
    hand_side_history = []
    last_results = {}
    last_features = None
    frame_count = 0
    processing_interval = 5  # Process every 5th frame
    last_player_time = time.time()
    last_ball_time = time.time()
    no_detection_reason = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        frame_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

        if frame_count % processing_interval == 1:
            features = extract_features(frame)
            if features is None:
                # If no features detected and we haven't seen any before,
                # check if timeout (3 seconds) has been reached.
                if last_features is None and (time.time() - last_player_time >= 3):
                    no_detection_reason = "No player detected for 3 seconds. Stopping processing."
                    break
            else:
                last_player_time = time.time()
                last_features = features

            if features is not None:
                # Evaluate the frame using the crossover evaluator.
                results, switch_times, previous_hand_side, hand_side_history = evaluate_frame(
                    features, frame_time, switch_times, previous_hand_side, hand_side_history
                )
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

    # Prepare textual evaluation by joining the final results.
    evaluation_lines = []
    for key, value in last_results.items():
        evaluation_lines.append(f"{key}: {value}")
    analysis_text = "\n".join(evaluation_lines)

    # Compress the annotated video.
    compressed_filename = f"{base_name}_annotated_compressed_{int(time.time())}.mp4"
    compressed_out_path = os.path.join(output_folder, compressed_filename)
    compress_video(out_path, compressed_out_path)
    print(f"Compressed annotated video saved at: {compressed_out_path}")

    # Delete the larger, uncompressed video file.
    if os.path.exists(out_path):
        os.remove(out_path)

    return compressed_out_path, analysis_text

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    return process_video_file(input_path, output_folder)
