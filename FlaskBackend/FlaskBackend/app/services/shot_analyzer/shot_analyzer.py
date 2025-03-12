#!/usr/bin/env python
import os
import pathlib
import sys
import logging

# Configure logging first
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Set up YOLOv5 path properly - MUST do this before other imports
current_dir = os.path.dirname(os.path.abspath(__file__))
yolov5_dir = os.path.join(current_dir, "yolov5")

# Check YOLOv5 directory exists
if not os.path.exists(yolov5_dir):
    logger.error(f"YOLOv5 directory not found at: {yolov5_dir}")
    # Try to set up YOLOv5 using the setup script
    try:
        from setup import setup_yolov5
        setup_yolov5()
        logger.info("Ran setup_yolov5() to initialize YOLOv5")
    except Exception as e:
        logger.error(f"Failed to setup YOLOv5: {str(e)}")
else:
    logger.info(f"Found YOLOv5 directory at: {yolov5_dir}")

# Add YOLOv5 to sys.path (before importing other packages)
if yolov5_dir not in sys.path:
    sys.path.insert(0, yolov5_dir)  # Insert at beginning to ensure it's found first
    logger.info(f"Added YOLOv5 directory to Python path")

# Check if the detect.py file exists
detect_path = os.path.join(yolov5_dir, "detect.py")
if os.path.exists(detect_path):
    logger.info(f"Found detect.py at: {detect_path}")
    
    # Try to ensure we can import from detect.py by adjusting the path
    yolov5_parent = os.path.dirname(yolov5_dir)
    if yolov5_parent not in sys.path:
        sys.path.insert(0, yolov5_parent)
        logger.info(f"Added YOLOv5 parent directory to Python path: {yolov5_parent}")
else:
    logger.error(f"detect.py not found at: {detect_path}")

# Now try to import from YOLOv5
try:
    # Method 1: Import directly from the detect.py module using importlib
    import importlib.util
    spec = importlib.util.spec_from_file_location("yolov5_detect", detect_path)
    yolov5_detect = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(yolov5_detect)
    run = yolov5_detect.run
    logger.info("Successfully imported YOLOv5 detect.run using importlib")
except Exception as e:
    logger.error(f"Failed to import YOLOv5 with importlib: {str(e)}")
    
    # Method 2: Try the standard import as a fallback
    try:
        from yolov5.detect import run
        logger.info("Successfully imported YOLOv5 detect.run")
    except ImportError as e:
        logger.error(f"Failed to import YOLOv5: {str(e)}")
        # Print Python path for debugging
        logger.error(f"Python path: {sys.path}")
        # Create a fallback function in case import fails
        def run(*args, **kwargs):
            logger.error("YOLOv5 run function not available. Using fallback.")
            return None

# Now import other necessary modules
import cv2
import numpy as np
import glob
import time

# Try to import mediapipe, but handle gracefully if not available
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
    logger.info("Successfully imported mediapipe")
    
    # Try to set MediaPipe logging level and pre-initialize
    try:
        mp_logger = logging.getLogger('mediapipe')
        if mp_logger:
            mp_logger.setLevel(logging.ERROR)  # Only show errors, not warnings
        
        # Pre-initialize MediaPipe solutions to avoid runtime warnings
        mp_pose = mp.solutions.pose
        mp_drawing = mp.solutions.drawing_utils
        # Create a dummy pose detector with default settings
        dummy_pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        logger.info("MediaPipe pose detector pre-initialized")
    except Exception as e:
        logger.warning(f"Failed to pre-initialize MediaPipe: {str(e)}")
except ImportError:
    logger.warning("Mediapipe is not available. Pose detection features will be limited.")
    # Create dummy mp module with minimal functionality
    class DummyMP:
        class solutions:
            class pose:
                Pose = None
                class PoseLandmark:
                    NOSE = 0
                    LEFT_SHOULDER = 1
                    LEFT_ELBOW = 2
                    LEFT_WRIST = 3
                    RIGHT_WRIST = 4
                    LEFT_HIP = 5
                    LEFT_KNEE = 6
                    LEFT_ANKLE = 7
                
            class drawing_utils:
                pass
    
    mp = DummyMP()
    MEDIAPIPE_AVAILABLE = False

try:
    import matplotlib.pyplot as plt
    import scipy.optimize as optimize
except ImportError as e:
    logger.warning(f"Optional dependency not available: {str(e)}")
    # Create minimal implementations if needed

if os.name == 'nt':
    pathlib.PosixPath = pathlib.WindowsPath

# ---------------
# Helper Functions
# ---------------

def calculate_angle(a, b, c):
    """Calculate the angle (in degrees) between line segments ab and bc."""
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360.0 - angle
    return angle

def distance(x, y):
    return np.sqrt((y[0] - x[0]) ** 2 + (y[1] - x[1]) ** 2)

def ball_under_basket(bball, rim, threshold):
    """Check if the ball's center is near the rim horizontally and below it vertically."""
    # Safety checks
    if bball is None or rim is None:
        return False
    
    try:
        ball_x = (bball[0] + bball[2]) / 2
        rim_x = (rim[0] + rim[2]) / 2
        ball_y = (bball[1] + bball[3]) / 2
        rim_y = (rim[1] + rim[3]) / 2
        
        # Debug info
        logger.debug(f"Ball center: ({ball_x}, {ball_y}), Rim center: ({rim_x}, {rim_y})")
        
        if abs(ball_x - rim_x) < threshold and (ball_y - rim_y) > 0:
            return True
        return False
    except (IndexError, TypeError):
        logger.warning("Invalid coordinates in ball_under_basket check")
        return False

def get_tangent_angle(a, b):
    """Compute an approximated tangent angle between two bounding boxes."""
    a_x_mean = (a[0] + a[2]) / 2
    a_y_mean = (a[1] + a[3]) / 2
    b_x_mean = (b[0] + b[2]) / 2
    b_y_mean = (b[1] + b[3]) / 2
    x = (a_x_mean, a_y_mean)
    y = (b_x_mean, b_y_mean)
    z = (b_x_mean, a_y_mean)
    ang = calculate_angle(x, y, z)
    if ang > 90:
        ang = abs(90 - ang)
    return ang

def delete_folder_contents(folder_path):
    """Remove all files and subdirectories in the given folder."""
    if os.path.exists(folder_path):
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
            elif os.path.isdir(file_path):
                delete_folder_contents(file_path)
                os.rmdir(file_path)

def get_pose_info(frame):
    """
    Process the frame with MediaPipe to extract pose landmarks and compute key angles.
    Returns: (frame, head_x, head_y, left_hand_coords, right_hand_coords,
              elbow_angle, knee_angle, [left_elbow.x, left_elbow.y], [left_knee.x, left_knee.y], left_shoulder)
    
    If MediaPipe is not available, returns a simplified version with default values.
    """
    if not MEDIAPIPE_AVAILABLE:
        # Return default values if MediaPipe is not available
        height, width = frame.shape[:2]
        # Set reasonable default positions based on image dimensions
        head_x, head_y = 0.5, 0.3  # Center-top area
        left_hand_coords = [0.3, 0.6]  # Left side, middle height
        right_hand_coords = [0.7, 0.6]  # Right side, middle height
        elbow_angle = 150  # Typical shooting elbow angle
        knee_angle = 140   # Typical shooting knee angle
        left_elbow_coo = [0.3, 0.5]  # Left side, middle
        left_knee_coo = [0.4, 0.8]   # Lower left
        
        # Create a DummyLandmark to maintain API compatibility
        class DummyLandmark:
            def __init__(self, x, y):
                self.x = x
                self.y = y
        
        left_shoulder = DummyLandmark(0.4, 0.4)
        
        # Add text annotations to the frame for visualization
        cv2.putText(frame, f"MediaPipe not available", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        cv2.putText(frame, f"Using default pose values", (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        
        # Draw simplified stick figure to visualize the pose
        h, w = frame.shape[:2]
        cv2.circle(frame, (int(head_x * w), int(head_y * h)), 20, (0, 255, 0), 2)  # Head
        cv2.line(frame, (int(head_x * w), int(head_y * h)), 
                (int(left_shoulder.x * w), int(left_shoulder.y * h)), (0, 255, 0), 2)  # Neck
        cv2.line(frame, (int(left_shoulder.x * w), int(left_shoulder.y * h)), 
                (int(left_elbow_coo[0] * w), int(left_elbow_coo[1] * h)), (0, 255, 0), 2)  # Upper arm
        cv2.line(frame, (int(left_elbow_coo[0] * w), int(left_elbow_coo[1] * h)), 
                (int(left_hand_coords[0] * w), int(left_hand_coords[1] * h)), (0, 255, 0), 2)  # Lower arm
        
        # Add angle text
        cv2.putText(frame, f"Elbow Angle: {elbow_angle:.2f} deg", (10, 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        cv2.putText(frame, f"Knee Angle: {knee_angle:.2f} deg", (10, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        
        return frame, head_x, head_y, left_hand_coords, right_hand_coords, elbow_angle, knee_angle, left_elbow_coo, left_knee_coo, left_shoulder
    
    # Normal MediaPipe-based pose detection when available
    mp_pose = mp.solutions.pose
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    try:
        with mp_pose.Pose(min_detection_confidence=0.05, min_tracking_confidence=0.05) as pose:
            results = pose.process(frame_rgb)
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
                left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
                left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
                left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
                head = landmarks[mp_pose.PoseLandmark.NOSE]
                left_hand = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                right_hand = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]

                left_hand_coords = [left_hand.x, left_hand.y]
                right_hand_coords = [right_hand.x, right_hand.y]
                head_x, head_y = head.x, head.y

                elbow_angle = calculate_angle((left_shoulder.x, left_shoulder.y),
                                            (left_elbow.x, left_elbow.y),
                                            (left_wrist.x, left_wrist.y))
                knee_angle = calculate_angle((left_hip.x, left_hip.y),
                                            (left_knee.x, left_knee.y),
                                            (left_ankle.x, left_ankle.y))

                cv2.putText(frame, f"Elbow Angle: {elbow_angle:.2f} deg", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
                cv2.putText(frame, f"Knee Angle: {knee_angle:.2f} deg", (10, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
                
                return frame, head_x, head_y, left_hand_coords, right_hand_coords, elbow_angle, knee_angle, [left_elbow.x, left_elbow.y], [left_knee.x, left_knee.y], left_shoulder
            else:
                logger.warning("No pose landmarks detected")
                return None
    except Exception as e:
        logger.error(f"Error in pose detection: {str(e)}")
        return None

def release_start(boxes, classes, y_elbow):
    """Check if the ball's bounding box (y-coordinate) indicates a release start."""
    # Safety checks
    if boxes is None or len(boxes) == 0 or classes is None or len(classes) == 0 or len(classes[0]) == 0:
        return False
        
    if 0 not in classes[0]:
        return False
        
    # Handle different array types
    if isinstance(classes[0], np.ndarray):
        indices = np.where(classes[0] == 0)[0]
        if len(indices) == 0:
            return False
        b_index = indices[0]
    else:
        try:
            b_index = list(classes[0]).index(0)
        except (ValueError, TypeError):
            return False
    
    # Make sure b_index is valid
    if b_index >= len(boxes):
        return False
        
    # Check if the ball is above the elbow
    try:
        y_box = boxes[b_index][3]  # Bottom of the ball bounding box
        return y_box < y_elbow
    except (IndexError, TypeError):
        return False

def ball_near_body(boxes, classes, right_hand, left_hand, threshold):
    """Check if the detected ball is near either hand."""
    # Safety checks
    if boxes is None or len(boxes) == 0 or classes is None or len(classes) == 0 or len(classes[0]) == 0:
        return False
        
    if 0 not in classes[0]:
        return False
        
    # Handle different array types
    if isinstance(classes[0], np.ndarray):
        indices = np.where(classes[0] == 0)[0]
        if len(indices) == 0:
            return False
        b_index = indices[0]
    else:
        try:
            b_index = list(classes[0]).index(0)
        except (ValueError, TypeError):
            return False
    
    # Make sure b_index is valid
    if b_index >= len(boxes):
        return False
        
    try:
        box = boxes[b_index]
        return distance(box, right_hand) < threshold or distance(box, left_hand) < threshold
    except (IndexError, TypeError):
        return False

def find_suitable_ball(bball_coords):
    """In a sequence of detected ball positions, find a previous valid detection."""
    if len(bball_coords) < 2:
        return None
    i = len(bball_coords) - 2
    while i >= 0:
        if bball_coords[i] is not None and bball_coords[i][0] is not None:
            return bball_coords[i]
        i -= 1

def release_end(boxes, classes, hand_coords, threshold):
    """Check if the ball has moved far enough from the hand to mark shot release end."""
    # Safety checks
    if boxes is None or len(boxes) == 0 or classes is None or len(classes) == 0 or len(classes[0]) == 0:
        return False
        
    if 0 not in classes[0]:
        return False
        
    # Handle different array types
    if isinstance(classes[0], np.ndarray):
        indices = np.where(classes[0] == 0)[0]
        if len(indices) == 0:
            return False
        b_index = indices[0]
    else:
        try:
            b_index = list(classes[0]).index(0)
        except (ValueError, TypeError):
            return False
    
    # Make sure b_index is valid
    if b_index >= len(boxes):
        return False
        
    try:
        box = boxes[b_index]
        return distance(box, hand_coords) > threshold
    except (IndexError, TypeError):
        return False

def trajectory_fit(shot_tracking, height, width, folder_path):
    """
    For each shot, fit a quadratic curve to the ball trajectory and draw it on a blank image.
    Save the resulting trace images in folder_path.
    """
    if os.path.exists(folder_path):
        delete_folder_contents(folder_path)
    else:
        os.makedirs(folder_path)
    counter = 1
    for shot in shot_tracking:
        balls = shot_tracking[shot]['bball']
        rims = shot_tracking[shot]['rim']
        release_tracking = shot_tracking[shot]['release_tracking']
        trace = np.full((int(height), int(width), 3), 255, dtype=np.uint8)
        x_data = []
        y_data = []
        n = min(len(balls), len(release_tracking))  # Ensure we don't go out of range
        for i in range(n):
            box = balls[i]
            if box is not None and release_tracking[i]:
                x_min, y_min, x_max, y_max = map(int, box)
                center_x = (x_min + x_max) // 2
                center_y = (y_min + y_max) // 2
                radius = min((x_max - x_min) // 2, (y_max - y_min) // 2)
                cv2.circle(trace, (center_x, center_y), radius, (0, 0, 255), 2)
                x_data.append(center_x)
                y_data.append(center_y)
        if len(x_data) > 0 and len(y_data) > 0:
            def curve_func(x, a, b, c):
                return a * x ** 2 + b * x + c
            params, _ = optimize.curve_fit(curve_func, x_data, y_data)
            curve_x = np.linspace(min(x_data), max(x_data), 100)
            curve_y = curve_func(curve_x, *params)
            for i in range(len(curve_x) - 1):
                cv2.line(trace, (int(curve_x[i]), int(curve_y[i])),
                         (int(curve_x[i + 1]), int(curve_y[i + 1])), (0, 0, 255), 2)
        for box in rims:
            if box is not None:
                x_min, y_min, x_max, y_max = map(int, box)
                cv2.rectangle(trace, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
                break
        text = shot_tracking[shot]['result'] if shot_tracking[shot]['result'] is not None else "Unknown"
        cv2.putText(trace, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        out_filename = os.path.join(folder_path, f"trace_{counter}.jpg")
        cv2.imwrite(out_filename, trace)
        counter += 1

def detect_API(img, img_path, response):
    """
    Run YOLOv5 detection on the provided image by calling run() with save_txt=True and exist_ok=True,
    then read the detection results from the label file and parse them.
    Returns annotated image, boxes, scores, classes, and image dimensions.
    """
    height, width = img.shape[:2]
    
    # Use absolute paths for runs folder and weights
    base_dir = os.path.dirname(os.path.abspath(__file__))
    runs_folder = os.path.join(base_dir, "output", "runs")
    weights_path = os.path.join(base_dir, "weights", "basket_rim.pt")
    
    # Create runs folder if it doesn't exist
    os.makedirs(runs_folder, exist_ok=True)
    
    name = "run"
    
    # Check if weights file exists
    if not os.path.exists(weights_path):
        logger.error(f"Weights file not found: {weights_path}")
        # Try more locations
        alt_paths = [
            os.path.join(yolov5_dir, "weights", "basket_rim.pt"),
            os.path.join(current_dir, "basket_rim.pt"),
            os.path.join(yolov5_dir, "basket_rim.pt")
        ]
        
        for alt_path in alt_paths:
            if os.path.exists(alt_path):
                logger.info(f"Found weights at alternative path: {alt_path}")
                weights_path = alt_path
                break
        else:
            logger.error("Could not find weights file in any location")
            return img, np.empty((0, 4)), [np.empty((0,))], np.array([[]]), height, width
    
    # Check if YOLOv5 run function is available (it might be a fallback function if import failed)
    if run.__module__ == '__main__':
        logger.error("YOLOv5 run function is not available, using fallback detection")
        # Implement a simple fallback detection method using OpenCV
        # This is just to allow the code to run even if YOLOv5 is not available
        try:
            # Basic circle detection for basketball
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (11, 11), 0)
            circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, 1.2, 100,
                                      param1=100, param2=30, minRadius=20, maxRadius=100)
            
            boxes = []
            scores = []
            classes_arr = []
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                
                # Get the most likely circle (first one)
                (x, y, r) = circles[0]
                
                # Create bounding box for ball
                xmin = max(0, x - r)
                ymin = max(0, y - r)
                xmax = min(width, x + r)
                ymax = min(height, y + r)
                
                boxes.append([xmin, ymin, xmax, ymax])
                scores.append(0.7)  # Arbitrary confidence score
                classes_arr.append(0)  # Class 0 = ball
                
                # Draw circle on image
                cv2.circle(img, (x, y), r, (255, 0, 0), 2)
                cv2.putText(img, "BALL (fallback)", (x - r, y - r - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
            # Perform edge detection for potential rim (horizontal lines in upper part of image)
            upper_half = gray[:height//2, :]
            edges = cv2.Canny(upper_half, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
            
            if lines is not None:
                # Find horizontal lines (possible rim)
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    if abs(y2 - y1) < 10:  # Fairly horizontal line
                        # Create bounding box for rim
                        xmin = min(x1, x2)
                        ymin = min(y1, y2) - 5
                        xmax = max(x1, x2)
                        ymax = max(y1, y2) + 5
                        
                        boxes.append([xmin, ymin, xmax, ymax])
                        scores.append(0.6)  # Arbitrary confidence score
                        classes_arr.append(2)  # Class 2 = rim
                        
                        # Draw rim on image
                        cv2.rectangle(img, (xmin, ymin), (xmax, ymax), (0, 0, 255), 2)
                        cv2.putText(img, "RIM (fallback)", (xmin, ymin - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        break  # Just use the first horizontal line
            
            # Convert to numpy arrays for consistent return format
            boxes = np.array(boxes) if boxes else np.empty((0, 4))
            scores_list = [np.array(scores) if scores else np.empty((0,))]
            classes_list = [np.array(classes_arr) if classes_arr else np.empty((0,))]
            
            return img, boxes, scores_list, np.array(classes_list), height, width
            
        except Exception as e:
            logger.error(f"Error in fallback detection: {str(e)}")
            return img, np.empty((0, 4)), [np.empty((0,))], np.array([[]]), height, width
    
    # Call YOLOv5 run() with exist_ok=True and nosave=True to keep output consistent and skip saving images.
    try:
        _ = run(
            weights=weights_path,
            source=img_path,
            conf_thres=0.1,
            project=runs_folder,
            name=name,
            exist_ok=True,
            classes=[0, 2],
            save_txt=True,
            nosave=True
        )
    except Exception as e:
        logger.error(f"Error running YOLOv5 detection: {str(e)}")
        return img, np.empty((0, 4)), [np.empty((0,))], np.array([[]]), height, width
    
    # Expected label filename:
    label_filename = os.path.splitext(os.path.basename(img_path))[0] + ".txt"
    label_path = os.path.join(runs_folder, name, "labels", label_filename)
    boxes = []
    scores = []
    classes_arr = []
    if os.path.exists(label_path):
        with open(label_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                # Handle both 5-field and 6-field formats:
                if len(parts) == 5:
                    cls, x_center, y_center, w, h = parts
                    conf = 1.0
                elif len(parts) >= 6:
                    cls, conf, x_center, y_center, w, h = parts[:6]
                    conf = float(conf)
                else:
                    continue
                cls = int(cls)
                x_center, y_center, w, h = map(float, [x_center, y_center, w, h])
                # Convert normalized coordinates to pixels:
                x_center *= width
                y_center *= height
                w *= width
                h *= height
                xmin = x_center - w / 2
                ymin = y_center - h / 2
                xmax = x_center + w / 2
                ymax = y_center + h / 2
                boxes.append([xmin, ymin, xmax, ymax])
                scores.append(conf)
                classes_arr.append(cls)
    else:
        logger.error(f"Label file not found: {label_path}")
    # Annotate the image with bounding boxes:
    for i, box in enumerate(boxes):
        if scores[i] > 0.055:
            xmin, ymin, xmax, ymax = map(int, box)
            xCoor = int((xmin + xmax) / 2)
            yCoor = int((ymin + ymax) / 2)
            if int(classes_arr[i]) == 0:  # Basketball: draw circle
                cv2.circle(img, (xCoor, yCoor), 25, (255, 0, 0), 2)
                cv2.putText(img, "BALL", (xCoor - 50, yCoor - 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            if int(classes_arr[i]) == 2:  # Rim: draw rectangle
                cv2.rectangle(img, (xmin, ymin), (xmax, ymax), (48, 124, 255), 2)
                cv2.putText(img, "RIM", (xCoor - 65, yCoor - 65),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (48, 124, 255), 2)
    
    # Match the expected output format from the original function
    boxes = np.array(boxes) if boxes else np.empty((0, 4))
    scores_list = [np.array(scores) if scores else np.empty((0,))]
    classes_list = [np.array(classes_arr) if classes_arr else np.empty((0,))]
    
    return img, boxes, scores_list, np.array(classes_list), height, width

def getVideoStreams(video_path):
    """
    Process a video: extract frames, run detection and pose estimation, detect shot release,
    and output an annotated video.
    Returns metrics: shooting times, release angles, make/miss list, knee angles, elbow angles, fps, and output video path.
    """
    logger.info(f"Starting getVideoStreams for video: {video_path}")
    start_time = time.time()
    
    shooting_time = []
    release_angle = []
    make_or_miss = []
    knee_angles = []
    elbow_angles = []

    # Use absolute paths for output folders
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(base_dir, "output", f"output_video_{int(time.time())}.mp4")
    logger.info(f"Output file will be: {output_file}")
    
    # Make sure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    logger.info(f"Ensured output directory exists: {os.path.dirname(output_file)}")
    
    # Open video file
    logger.info(f"Opening video file: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Failed to open video file: {video_path}")
        raise ValueError(f"Could not open video file: {video_path}")
    
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height= int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    logger.info(f"Video dimensions: {frame_width}x{frame_height}")
    
    # Use the actual input FPS or force 23 if needed:
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps > 60:  # Handle invalid FPS values
        fps = 23.0
        logger.warning(f"Video FPS was {fps}, forcing to 23.0")
    else:
        logger.info(f"Video FPS: {fps}")
    
    # Use the same FPS for output to maintain timing
    output_fps = fps
    logger.info(f"Output FPS set to: {output_fps}")

    coords_tracking = {"bball": [], "rim": [], "distances": []}
    shot_tracking = {1: {"bball": [], "rim": [], "result": None, "release_frames": 0, "release_tracking": []}}
    shot_number = 1

    # Use absolute paths for runs and traces folders
    runs_folder = os.path.join(base_dir, "output", "runs")
    traces_folder = os.path.join(base_dir, "output", "traces")
    logger.info(f"Runs folder: {runs_folder}")
    logger.info(f"Traces folder: {traces_folder}")
    
    # Make sure directories exist
    os.makedirs(runs_folder, exist_ok=True)
    os.makedirs(traces_folder, exist_ok=True)
    
    logger.info("Cleaning output folders")
    delete_folder_contents(runs_folder)
    delete_folder_contents(traces_folder)

    logger.info("Setting up video writer")
    # Create video writer
    logger.info(f"Creating video writer with dimensions {frame_width}x{frame_height} at {output_fps} fps")
    try:
        # Try with H.264 codec first (most compatible)
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 codec
        output_video = cv2.VideoWriter(output_file, fourcc, output_fps, (frame_width, frame_height))
        
        # Check if writer was created successfully
        if not output_video.isOpened():
            logger.warning("Failed to create video writer with avc1 codec, trying mp4v")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Fallback to mp4v
            output_video = cv2.VideoWriter(output_file, fourcc, output_fps, (frame_width, frame_height))
    except Exception as writer_error:
        logger.error(f"Error creating video writer: {str(writer_error)}")
        # Try with default codec as last resort
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        output_video = cv2.VideoWriter(output_file, fourcc, output_fps, (frame_width, frame_height))
    
    logger.info("Video writer created")

    release_started = False
    release_ended = False
    tracking_shot = False
    skip_count = 0
    knee_angle_min = 366
    elbow_angle_min = 366

    frame_counter = 0
    logger.info("Starting frame processing loop")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            logger.info("End of video reached")
            break
        
        frame_counter += 1
        skip_count += 1
        if skip_count < 4:  # Process only every 4th frame for speed
            continue
        skip_count = 0
        
        # Create a unique temporary filename for this frame
        temp_filename = os.path.join(base_dir, "output", f"temp_{frame_counter}.jpg")
        cv2.imwrite(temp_filename, frame)
        
        # Get pose information - don't write the temp file again in get_pose_info
        pose_out = None
        mp_pose = mp.solutions.pose
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        with mp_pose.Pose(min_detection_confidence=0.05, min_tracking_confidence=0.05) as pose:
            results = pose.process(frame_rgb)
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
                left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
                left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
                left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
                head = landmarks[mp_pose.PoseLandmark.NOSE]
                left_hand = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                right_hand = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]

                left_hand_coords = [left_hand.x, left_hand.y]
                right_hand_coords = [right_hand.x, right_hand.y]
                head_x, head_y = head.x, head.y

                elbow_angle = calculate_angle((left_shoulder.x, left_shoulder.y),
                                            (left_elbow.x, left_elbow.y),
                                            (left_wrist.x, left_wrist.y))
                knee_angle = calculate_angle((left_hip.x, left_hip.y),
                                            (left_knee.x, left_knee.y),
                                            (left_ankle.x, left_ankle.y))

                cv2.putText(frame, f"Elbow Angle: {elbow_angle:.2f} deg", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
                cv2.putText(frame, f"Knee Angle: {knee_angle:.2f} deg", (10, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
                
                pose_out = frame, head_x, head_y, left_hand_coords, right_hand_coords, elbow_angle, knee_angle, [left_elbow.x, left_elbow.y], [left_knee.x, left_knee.y], left_shoulder

        # Run YOLOv5 detection on the temp file if pose was detected
        if pose_out is not None:
            (frame, head_x, head_y, left_hand, right_hand, elbow_angle, knee_angle,
            left_elbow_coo, left_knee_coo, left_shoulder) = pose_out
            
            # Run YOLOv5 detection
            img, boxes, scores, classes, height_img, width_img = detect_API(frame, temp_filename, [])
        else:
            # If pose detection failed, still try object detection
            logger.warning(f"Pose detection failed for frame {frame_counter}")
            img, boxes, scores, classes, height_img, width_img = detect_API(frame, temp_filename, [])
            
            # Set default values for pose-related variables
            head_x, head_y = 0.5, 0.5  # Center of frame
            left_hand = right_hand = [0.5, 0.5]  # Center of frame
            elbow_angle = knee_angle = 180.0  # Default angles
            left_elbow_coo = left_knee_coo = [0.5, 0.5]  # Center of frame
            left_shoulder = None
        
        # Clean up the temporary file
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                logger.warning(f"Could not remove temporary file {temp_filename}: {str(e)}")

        # Track ball detections
        if 0 not in classes[0]:
            coords_tracking["bball"].append(None)
            shot_tracking[shot_number]["bball"].append(None)
        else:
            b_index = 0 if classes[0][0] == 0 else 1
            coords_tracking["bball"].append(boxes[b_index])
            shot_tracking[shot_number]["bball"].append(boxes[b_index])
            
        # Track rim detections
        if 2 not in classes[0]:
            coords_tracking["rim"].append(None)
            shot_tracking[shot_number]["rim"].append(None)
        else:
            b_index = 0 if classes[0][0] == 2 else 1
            coords_tracking["rim"].append(boxes[b_index])
            shot_tracking[shot_number]["rim"].append(boxes[b_index])
            
        # Track distances between ball and rim
        if coords_tracking["rim"] and coords_tracking["bball"] and \
           coords_tracking["rim"][-1] is not None and coords_tracking["bball"][-1] is not None:
            coords_tracking["distances"].append(distance(coords_tracking["rim"][-1], coords_tracking["bball"][-1]))

        # Scale hand coordinates to pixel values
        left_hand_px = [left_hand[0] * width_img, left_hand[1] * height_img]
        right_hand_px = [right_hand[0] * width_img, right_hand[1] * height_img]

        # Detect shot release start using head y-coordinate as reference
        if not release_started:
            shot_tracking[shot_number]["release_tracking"].append(False)
            release_started = release_start(boxes, classes, left_shoulder.y * height_img)
            if release_started and ball_near_body(boxes, classes, right_hand_px, left_hand_px, 100):
                cv2.putText(frame, "RELEASE STARTED", (int(width_img/2), int(height_img/2)),
                            cv2.FONT_HERSHEY_SIMPLEX, 3, (0,0,255), 2)
                release_ended = False
                knee_angle_min = 366
                elbow_angle_min = 366
            else:
                release_started = False
                
        # Track shot release
        elif release_started and not release_ended:
            shot_tracking[shot_number]["release_frames"] += 1
            shot_tracking[shot_number]["release_tracking"].append(True)
            release_ended = release_end(boxes, classes, right_hand_px, 120)
            
            # Track minimum angles during the shot
            if knee_angle > 90:
                knee_angle_min = min(knee_angle_min, knee_angle)
            if elbow_angle > 90:
                elbow_angle_min = min(elbow_angle_min, elbow_angle)
                
            if release_ended:
                cv2.putText(frame, "RELEASE ENDED", (int(width_img/2), int(height_img/2)),
                            cv2.FONT_HERSHEY_SIMPLEX, 3, (0,0,255), 2)
                tracking_shot = True
                if len(coords_tracking["bball"]) > 1:
                    angle = get_tangent_angle(coords_tracking["bball"][-1],
                                              find_suitable_ball(coords_tracking["bball"]))
                    release_angle.append(angle)
                    cv2.putText(frame, f"ANGLE SHOT: {round(angle,2)}", (int(width_img/4), int(height_img/4)),
                                cv2.FONT_HERSHEY_SIMPLEX, 3, (0,0,255), 2)
                                
        # Check if shot is complete
        elif release_started and release_ended and tracking_shot:
            if len(coords_tracking["distances"]) >= 2:
                if coords_tracking["distances"][-1] > coords_tracking["distances"][-2] and \
                   coords_tracking["bball"][-1] is not None and coords_tracking["rim"][-1] is not None:
                    cv2.putText(frame, "BALL MOVING AWAY", (int(width_img/4), int(height_img/4)),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
                    tracking_shot = False
                    
                    # Determine if shot was made or missed
                    if ball_under_basket(coords_tracking["bball"][-1], coords_tracking["rim"][-1], 70):
                        cv2.putText(frame, "SCORE", (int(width_img/2), int(height_img/2)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 3, (0,255,0), 2)
                        shot_tracking[shot_number]["result"] = "Make"
                        make_or_miss.append("Make")
                        shot_tracking[shot_number]["release_tracking"].append(False)
                        shot_number += 1
                        shot_tracking[shot_number] = {"bball": [], "rim": [], "result": None, "release_frames": 0, "release_tracking": []}
                        tracking_shot = False
                        knee_angles.append(knee_angle_min)
                        elbow_angles.append(elbow_angle_min)
                    else:
                        cv2.putText(frame, "MISS", (int(width_img/2), int(height_img/2)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 3, (0,0,255), 2)
                        shot_tracking[shot_number]["result"] = "Miss"
                        make_or_miss.append("Miss")
                        shot_number += 1
                        shot_tracking[shot_number] = {"bball": [], "rim": [], "result": None, "release_frames": 0, "release_tracking": []}
                        knee_angles.append(knee_angle_min)
                        elbow_angles.append(elbow_angle_min)
                else:
                    shot_tracking[shot_number]["release_frames"] += 1
                    shot_tracking[shot_number]["release_tracking"].append(True)
            else:
                shot_tracking[shot_number]["release_tracking"].append(False)
        else:
            shot_tracking[shot_number]["release_tracking"].append(False)

        # Reset mechanism: if ball is detected near the body again
        if release_started and release_ended and ball_near_body(boxes, classes, right_hand_px, left_hand_px, 50):
            shot_tracking[shot_number]["release_tracking"].append(False)
            release_started = False
            release_ended = False
            tracking_shot = False
            coords_tracking["bball"] = []
            coords_tracking["rim"] = []
            coords_tracking["distances"] = []
            cv2.putText(frame, "RESET", (int(width_img/1.5), int(height_img/1.5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

        output_video.write(frame)
        
    # Generate trajectory trace images for each shot
    logger.info("Generating trajectory traces")
    try:
        trajectory_fit(shot_tracking, height_img, width_img, traces_folder)
        logger.info("Trajectory traces generated successfully")
    except Exception as e:
        logger.error(f"Error generating trajectory traces: {str(e)}")
    
    # Close video resources
    logger.info("Finalizing video output")
    output_video.release()
    cap.release()
    
    # Verify the output file exists and has content
    if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
        logger.info(f"Output video successfully created: {output_file} ({os.path.getsize(output_file)} bytes)")
    else:
        logger.error(f"Output video file is missing or empty: {output_file}")
    
    # Compute shooting time per shot from release frames
    logger.info("Computing final metrics")
    for shot_id in sorted(shot_tracking.keys()):
        if shot_tracking[shot_id]["result"] is not None:
            shooting_time.append(shot_tracking[shot_id]["release_frames"])
    
    # Adjust elbow angles (subtract 90 as per original logic)
    elbow_angles = [x - 90 for x in elbow_angles]
    
    # Check for any missing values and replace with reasonable defaults
    # This ensures we always return properly formatted metrics
    if not shooting_time and make_or_miss:
        shooting_time = [10] * len(make_or_miss)  # Default value
    
    if not release_angle and make_or_miss:
        release_angle = [45] * len(make_or_miss)  # Default value
    
    if not knee_angles and make_or_miss:
        knee_angles = [120] * len(make_or_miss)  # Default value
    
    if not elbow_angles and make_or_miss:
        elbow_angles = [0] * len(make_or_miss)  # Default value
    
    total_time = time.time() - start_time
    logger.info(f"Total processing time: {total_time:.2f} seconds")
    logger.info(f"Processing speed: {frame_counter / total_time:.2f} frames per second")
    
    return shooting_time, release_angle, make_or_miss, knee_angles, elbow_angles, fps, output_file

# ---------------
# Main Testing Routine
# ---------------
if __name__ == '__main__':
    input_folder = "input"
    video_files = glob.glob(os.path.join(input_folder, "*.mp4"))
    if not video_files:
        print("No video files found in the input folder.")
    for video_path in video_files:
        print(f"Processing video: {video_path}")
        metrics = getVideoStreams(video_path)
        shooting_time, release_angle, make_or_miss, knee_angles, elbow_angles, fps, output_file = metrics
        print("Results for video:", os.path.basename(video_path))
        print("Shooting Times (frames):", shooting_time)
        print("Release Angles (deg):", release_angle)
        print("Make or Miss:", make_or_miss)
        print("Knee Angles (deg):", knee_angles)
        print("Elbow Angles (deg):", elbow_angles)
        print("FPS:", fps)
        print("Output Video Path:", output_file)
