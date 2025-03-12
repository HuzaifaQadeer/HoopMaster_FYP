#!/usr/bin/env python
import os
import sys
import logging
import cv2

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_detect")

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

def test_detection():
    # Setup YOLOv5
    yolov5_dir, weights_path = setup_yolov5()
    
    # Create a test image (simple black image with white circle)
    test_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_image.jpg")
    img = cv2.imread("temp.jpg" if os.path.exists("temp.jpg") else "temp_436.jpg")
    
    if img is None:
        logger.error("No test image available")
        return
        
    # Save the test image
    cv2.imwrite(test_img_path, img)
    logger.info(f"Created test image at: {test_img_path}")
    
    # Import run from YOLOv5
    try:
        from yolov5.detect import run
        logger.info("Successfully imported run from YOLOv5")
        
        # Create output directory
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "test_run")
        os.makedirs(output_dir, exist_ok=True)
        
        # Run detection
        logger.info(f"Running YOLOv5 detection with weights: {weights_path}")
        logger.info(f"Test image: {test_img_path}")
        
        try:
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
            expected_output = os.path.join(output_dir, "test", "test_image.jpg")
            if os.path.exists(expected_output):
                logger.info(f"Detection output found at: {expected_output}")
            else:
                logger.warning(f"Detection output not found at: {expected_output}")
                
        except Exception as e:
            logger.error(f"Error running YOLOv5 detection: {str(e)}")
            raise
            
    except ImportError as e:
        logger.error(f"Failed to import run from YOLOv5: {str(e)}")
        return

if __name__ == "__main__":
    test_detection() 