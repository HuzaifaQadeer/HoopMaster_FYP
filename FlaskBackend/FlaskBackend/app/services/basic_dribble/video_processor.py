import cv2
from .feature_extractor import extract_features
from .evaluator import evaluate_drill

def overlay_evaluation(frame, evaluation):
    """
    Overlay evaluation results onto the frame.
    """
    annotated_frame = frame.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.8
    thickness = 2
    color_good = (0, 255, 0)   # Green
    color_bad = (0, 0, 255)    # Red

    x_start = 10
    y_start = 30
    y_offset = 30

    for idx, (key, value) in enumerate(evaluation.items()):
        color = color_good if value == 'good' else color_bad
        text = f"{key.capitalize()}: {value.capitalize()}"
        position = (x_start, y_start + idx * y_offset)
        cv2.putText(annotated_frame, text, position, font, font_scale, color, thickness, cv2.LINE_AA)

    return annotated_frame

def process_video_frame(frame):
    """
    Process a single video frame and return the assessment and annotated frame.
    """
    features = extract_features(frame)
    if features is None:
        return None, frame

    evaluation = evaluate_drill(features)
    annotated_frame = overlay_evaluation(frame, evaluation)
    
    return evaluation, annotated_frame