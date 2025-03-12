#!/usr/bin/env python
import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_import")

# Current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
yolov5_dir = os.path.join(current_dir, "yolov5")

# Add YOLOv5 to path
if yolov5_dir not in sys.path:
    sys.path.insert(0, yolov5_dir)
    logger.info(f"Added YOLOv5 directory to Python path: {yolov5_dir}")

# Check Python path
logger.info(f"Python path: {sys.path}")

# Try different import methods
try:
    # Method 1: Direct import from yolov5 
    logger.info("Trying Method 1: import yolov5")
    import yolov5
    logger.info(f"Successful import: yolov5 version: {yolov5.__version__ if hasattr(yolov5, '__version__') else 'unknown'}")
except ImportError as e:
    logger.error(f"Method 1 failed: {str(e)}")

try:
    # Method 2: Import detect directly
    logger.info("Trying Method 2: from yolov5.detect import run")
    from yolov5.detect import run
    logger.info("Successfully imported detect.run")
except ImportError as e:
    logger.error(f"Method 2 failed: {str(e)}")

try:
    # Method 3: Import in a different way
    logger.info("Trying Method 3: direct import of detect.py")
    # Create a temporary sys.path with only the YOLOv5 directory
    sys.path = [yolov5_dir] + sys.path
    import detect
    logger.info("Successfully imported detect directly")
except ImportError as e:
    logger.error(f"Method 3 failed: {str(e)}")
    # Restore the original sys.path

try:
    # Method 4: Check if the file exists and import as a module
    logger.info("Trying Method 4: alternate import method")
    detect_path = os.path.join(yolov5_dir, "detect.py")
    if os.path.exists(detect_path):
        logger.info(f"detect.py exists at: {detect_path}")
        # Add the directory to sys.path again to be sure
        sys.path.insert(0, os.path.dirname(detect_path))
        # Use importlib to import it
        import importlib.util
        spec = importlib.util.spec_from_file_location("detect", detect_path)
        detect_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(detect_module)
        logger.info("Successfully imported detect.py using importlib")
        if hasattr(detect_module, "run"):
            logger.info("detect module has run function")
    else:
        logger.error(f"detect.py not found at: {detect_path}")
except Exception as e:
    logger.error(f"Method 4 failed: {str(e)}")

# Check for dependencies that might be required
try:
    logger.info("Checking for torch")
    import torch
    logger.info(f"Torch is available, version: {torch.__version__}")
except ImportError:
    logger.error("Torch is not available")

try:
    logger.info("Checking for required YOLOv5 dependencies")
    import numpy
    import cv2
    import matplotlib
    logger.info("Basic dependencies are available")
except ImportError as e:
    logger.error(f"Missing dependency: {str(e)}")

if __name__ == "__main__":
    logger.info("Test complete") 