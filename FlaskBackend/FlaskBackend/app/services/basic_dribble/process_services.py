import cv2
import os
import time
import subprocess
import mediapipe as mp
import torch
from app.services.basic_dribble.feature_extractor import extract_features
from app.services.basic_dribble.evaluator import BasicDribbleEvaluator

def clear_gpu_memory():
    """Clear GPU memory cache"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def overlay_evaluation(frame, feats, eval_res):
    annotated = frame.copy()
    if feats and "pose_landmarks" in feats:
        mp_drawing = mp.solutions.drawing_utils
        mp_pose = mp.solutions.pose
        # Draw keypoints in red (with larger circles) and connections in green.
        landmark_style = mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=3, circle_radius=5)
        connection_style = mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=3)
        mp_drawing.draw_landmarks(
            annotated,
            feats["pose_landmarks"],
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=landmark_style,
            connection_drawing_spec=connection_style
        )
    if eval_res is not None:
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        x_start, y_start = 10, 30
        y_offset = 25
        idx = 0
        for k, v in eval_res.items():
            color = (255, 255, 255)
            if v == "good":
                color = (0, 255, 0)
            elif v == "bad":
                color = (0, 0, 255)
            text = f"{k.capitalize()}: {v}"
            cv2.putText(
                annotated, text,
                (x_start, y_start + idx * y_offset),
                font, font_scale, color, thickness, cv2.LINE_AA
            )
            idx += 1
    return annotated

def compress_video(input_path, output_path):
    """
    Compress the video by reducing its bitrate based on the size of the input file.
    The target file size will be approximately 1/10th of the original.
    The FPS is kept consistent to ensure smooth video playback.
    """
    original_size_bytes = os.path.getsize(input_path)
    original_size_mb = original_size_bytes / (1024 * 1024)
    # Target size: 1/10th of the original
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
        "-y",  # Overwrite if exists
        "-i", input_path,
        "-b:v", f"{video_bitrate_k}k",
        "-r", str(fps),
        output_path
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def process_video_file(video_path, output_folder):
    # Clear GPU memory before starting
    clear_gpu_memory()
    
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
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out_writer = cv2.VideoWriter(out_path, fourcc, fps_in, (w, h), True)

    evaluator = BasicDribbleEvaluator()
    frame_index = 0
    processing_interval = 3  # Process one frame, skip two
    last_feats = None
    last_eval = None

    # Timeout thresholds (3 seconds instead of 5)
    last_person_detection_time = time.time()
    last_ball_detection_time = time.time()
    no_detection_reason = None

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_index += 1
            current_time = time.time()
            if frame_index % processing_interval == 1:
                feats, ball_xy = extract_features(frame)

                # If no player detected for 3 seconds, stop processing.
                if feats is None:
                    if current_time - last_person_detection_time >= 3:
                        no_detection_reason = "No player detected for 3 seconds. Stopping processing."
                        break
                else:
                    last_person_detection_time = current_time

                # If no ball detected for 3 seconds, stop processing.
                if ball_xy is None:
                    if current_time - last_ball_detection_time >= 3:
                        no_detection_reason = "No ball detected for 3 seconds. Stopping processing."
                        break
                else:
                    last_ball_detection_time = current_time

                if feats is not None:
                    eval_res = evaluator.evaluate_frame(feats, ball_xy)
                    last_feats = feats
                    last_eval = eval_res
                else:
                    if last_feats is not None:
                        eval_res = evaluator.evaluate_skipped_frame(last_feats)
                        last_eval = eval_res
                    else:
                        eval_res = None
            else:
                feats = last_feats
                eval_res = last_eval

            annotated = overlay_evaluation(frame, feats, eval_res)
            out_writer.write(annotated)

            # Periodically clear GPU memory
            if frame_index % 100 == 0:
                clear_gpu_memory()

    finally:
        cap.release()
        out_writer.release()
        clear_gpu_memory()  # Final cleanup

    # If timeout occurred, remove the annotated file (if created) and return only textual evaluation.
    if no_detection_reason is not None:
        print(no_detection_reason)
        if os.path.exists(out_path):
            os.remove(out_path)
        return None, "Upload a proper video. No ball or player found."

    # Otherwise, get the evaluation feedback.
    fb, score = evaluator.get_final_feedback()
    analysis_text = fb  # Full textual evaluation

    # Compress the annotated video.
    compressed_filename = f"{base_name}_annotated_compressed_{int(time.time())}.mp4"
    compressed_out_path = os.path.join(output_folder, compressed_filename)
    compress_video(out_path, compressed_out_path)
    print(f"Compressed annotated video saved at: {compressed_out_path}")

    # Delete the larger, uncompressed annotated video file.
    if os.path.exists(out_path):
        os.remove(out_path)

    return compressed_out_path, analysis_text

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    return process_video_file(input_path, output_folder)
