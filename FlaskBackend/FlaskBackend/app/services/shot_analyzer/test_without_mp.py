#!/usr/bin/env python
import os
import sys
import logging
import cv2

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_yolo_only")

def setup_yolov5():
    # Current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    yolov5_dir = os.path.join(current_dir, "yolov5")
    weights_dir = os.path.join(current_dir, "weights")
    weights_path = os.path.join(weights_dir, "basket_rim.pt")
    
    # Add YOLOv5 to path
    if yolov5_dir not in sys.path:
        sys.path.insert(0, yolov5_dir)
        logger.info(f"Added YOLOv5 directory to Python path: {yolov5_dir}")
        
    # Check if weights exist
    if os.path.exists(weights_path):
        logger.info(f"Weights file exists at: {weights_path}")
    else:
        logger.error(f"Weights file not found at: {weights_path}")
        
    return yolov5_dir, weights_path

def test_yolo_detection():
    """Test YOLOv5 detection directly without mediapipe dependencies"""
    # Setup YOLOv5
    yolov5_dir, weights_path = setup_yolov5()
    
    # Create a test image
    test_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_image.jpg")
    
    # Try to load an existing image file
    for possible_image in ["temp.jpg", "temp_436.jpg"]:
        if os.path.exists(possible_image):
            img = cv2.imread(possible_image)
            if img is not None:
                logger.info(f"Using existing image: {possible_image}")
                test_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), possible_image)
                break
    else:
        # If no existing image, create a simple one
        img = cv2.imread(test_img_path) if os.path.exists(test_img_path) else None
        if img is None:
            img = np.zeros((300, 300, 3), dtype=np.uint8)
            cv2.circle(img, (150, 150), 50, (0, 0, 255), -1)
            cv2.imwrite(test_img_path, img)
            logger.info(f"Created new test image at: {test_img_path}")
    
    # Import directly from detect.py
    try:
        import importlib.util
        detect_path = os.path.join(yolov5_dir, "detect.py")
        spec = importlib.util.spec_from_file_location("yolov5_detect", detect_path)
        yolov5_detect = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(yolov5_detect)
        run = yolov5_detect.run
        logger.info("Successfully imported YOLOv5 detect.run using importlib")
    except Exception as e:
        logger.error(f"Failed to import YOLOv5 with importlib: {str(e)}")
        try:
            from yolov5.detect import run
            logger.info("Successfully imported from yolov5.detect")
        except ImportError as e:
            logger.error(f"Could not import run function from YOLOv5: {str(e)}")
            return
            
    # Try running detection
    try:
        logger.info(f"Running YOLOv5 detection with weights: {weights_path}")
        logger.info(f"Test image: {test_img_path}")
        
        # Create output directory
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "yolo_only_test")
        os.makedirs(output_dir, exist_ok=True)
        
        # Run detection
        run(
            weights=weights_path,
            source=test_img_path,
            project=output_dir,
            name="test",
            exist_ok=True,
            save_txt=True
        )
        logger.info("YOLOv5 detection completed successfully")
        
        # Check for output
        expected_output = os.path.join(output_dir, "test", os.path.basename(test_img_path))
        if os.path.exists(expected_output):
            logger.info(f"Detection output found at: {expected_output}")
        else:
            logger.warning(f"Detection output not found at: {expected_output}")
            
    except Exception as e:
        logger.error(f"Error running YOLOv5 detection: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        import numpy as np
    except ImportError:
        logger.error("NumPy not available, installing it")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "numpy"], check=True)
        import numpy as np
        
    test_yolo_detection() 