import os
import cv2

from app.services.basic_dribble.feature_extractor import extract_features

from app.services.basic_dribble.evaluator import evaluate_drill

def process_basic_dribble_video(input_video_path, output_video_path):
    """
    Process and annotate the video for the 'basic dribble' drill.
    """
    cap = cv2.VideoCapture(input_video_path)
    frame_count = 0
    processing_interval = 5  # Process every 5th frame for efficiency
    last_evaluation = None  # To store the last evaluation results

    # Check if the video file opened successfully
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video file: {input_video_path}")

    # Get video properties for output
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec for output file

    # Initialize VideoWriter to save the annotated video
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (frame_width, frame_height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break  # End of video file

        frame_count += 1

        # Process every nth frame to maintain performance
        if frame_count % processing_interval == 0:
            features = extract_features(frame)
            if features is not None:
                evaluation = evaluate_drill(features)
                last_evaluation = evaluation  # Update last evaluation
                annotated_frame = overlay_evaluation(frame, last_evaluation)
            else:
                annotated_frame = frame
        else:
            if last_evaluation is not None:
                # Use the last evaluation to overlay
                annotated_frame = overlay_evaluation(frame, last_evaluation)
            else:
                annotated_frame = frame

        # Write the annotated frame to the output video
        out.write(annotated_frame)

    # Release resources
    cap.release()
    out.release()
    return output_video_path


def overlay_evaluation(frame, evaluation):
    """
    Overlay evaluation results onto the frame.
    """
    # Create a copy of the frame to draw on
    annotated_frame = frame.copy()

    # Set font and initial position
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.8
    thickness = 2
    color_good = (0, 255, 0)  # Green
    color_bad = (0, 0, 255)  # Red

    # Starting position for text
    x_start = 10
    y_start = 30
    y_offset = 30

    # Iterate over evaluation results and overlay them
    for idx, (key, value) in enumerate(evaluation.items()):
        color = color_good if value == 'good' else color_bad
        text = f"{key.capitalize()}: {value.capitalize()}"
        position = (x_start, y_start + idx * y_offset)
        cv2.putText(annotated_frame, text, position, font, font_scale, color, thickness, cv2.LINE_AA)

    return annotated_frame

