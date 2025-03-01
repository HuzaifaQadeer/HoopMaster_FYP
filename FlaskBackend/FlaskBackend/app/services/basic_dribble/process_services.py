import cv2
import os
import time
from app.services.basic_dribble.feature_extractor import extract_features
from app.services.basic_dribble.evaluator import BasicDribbleEvaluator

def overlay_evaluation(frame, feats, eval_res):
    annotated = frame.copy()
    if feats and "pose_landmarks" in feats:
        import mediapipe as mp
        mp_drawing = mp.solutions.drawing_utils
        mp_pose = mp.solutions.pose
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

def process_video_file(video_path, output_folder):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Could not open video file.")

    base_name = os.path.splitext(os.path.basename(video_path))[0]
    output_filename = f"{base_name}_annotated_{int(time.time())}.mp4"
    output_path = os.path.join(output_folder, output_filename)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps_in = cap.get(cv2.CAP_PROP_FPS)
    if fps_in <= 0:
        fps_in = 24
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out_writer = cv2.VideoWriter(output_path, fourcc, fps_in, (w, h), True)

    evaluator = BasicDribbleEvaluator()
    frame_index = 0
    processing_interval = 3  # process 1 out of every 3 frames
    last_feats = None
    last_eval = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_index += 1

        if frame_index % processing_interval == 1:
            feats, ball_xy = extract_features(frame)
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

    cap.release()
    out_writer.release()

    fb, score = evaluator.get_final_feedback()
    analysis_text = f"{fb}\nOverall Score: {score:.2f}"
    return output_path, analysis_text

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    return process_video_file(input_path, output_folder)
