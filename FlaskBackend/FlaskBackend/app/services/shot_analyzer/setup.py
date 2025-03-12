#!/usr/bin/env python
"""
Setup script for the shot_analyzer module.
This script ensures that YOLOv5 is properly initialized.
"""

import os
import sys
import logging
import shutil
import zipfile
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("setup")

def setup_yolov5():
    """
    Set up YOLOv5 by:
    1. Checking if the yolov5 directory exists
    2. If not, downloading from GitHub or extracting from zip file
    3. Making sure weights are in the correct location
    """
    # Get the directory of this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    yolov5_dir = os.path.join(current_dir, "yolov5")
    weights_dir = os.path.join(current_dir, "weights")
    
    # Create weights directory if it doesn't exist
    if not os.path.exists(weights_dir):
        os.makedirs(weights_dir)
        logger.info(f"Created weights directory: {weights_dir}")
    
    # Check if yolov5 directory exists
    if not os.path.exists(yolov5_dir):
        logger.warning(f"YOLOv5 directory not found at: {yolov5_dir}")
        
        # Check if we have a zip file to extract
        yolov5_zip = os.path.join(current_dir, "yolov5.zip")
        if os.path.exists(yolov5_zip):
            logger.info(f"Found YOLOv5 zip file: {yolov5_zip}")
            try:
                # Extract the zip file
                with zipfile.ZipFile(yolov5_zip, 'r') as zip_ref:
                    zip_ref.extractall(current_dir)
                logger.info(f"Extracted YOLOv5 from zip file")
                
                # Rename extracted directory if needed
                extracted_dir = None
                for item in os.listdir(current_dir):
                    if os.path.isdir(os.path.join(current_dir, item)) and "yolov5" in item.lower():
                        extracted_dir = os.path.join(current_dir, item)
                        break
                
                if extracted_dir and extracted_dir != yolov5_dir:
                    os.rename(extracted_dir, yolov5_dir)
                    logger.info(f"Renamed {extracted_dir} to {yolov5_dir}")
            except Exception as e:
                logger.error(f"Error extracting YOLOv5 zip: {str(e)}")
        else:
            logger.warning("YOLOv5 zip file not found. Attempting to clone from GitHub...")
            try:
                # Clone YOLOv5 repository
                subprocess.run(["git", "clone", "https://github.com/ultralytics/yolov5.git", yolov5_dir],
                              check=True)
                logger.info("Successfully cloned YOLOv5 from GitHub")
                
                # Install requirements
                requirements_file = os.path.join(yolov5_dir, "requirements.txt")
                if os.path.exists(requirements_file):
                    subprocess.run([sys.executable, "-m", "pip", "install", "-r", requirements_file],
                                  check=True)
                    logger.info("Installed YOLOv5 requirements")
            except Exception as e:
                logger.error(f"Error setting up YOLOv5: {str(e)}")
    else:
        logger.info(f"YOLOv5 directory already exists at: {yolov5_dir}")
    
    # Check if weights file exists
    weights_file = os.path.join(weights_dir, "basket_rim.pt")
    if not os.path.exists(weights_file):
        logger.warning(f"Weights file not found at: {weights_file}")
        
        # Look for weights file in yolov5 directory
        alt_weights_file = os.path.join(yolov5_dir, "weights", "basket_rim.pt")
        if os.path.exists(alt_weights_file):
            # Copy weights file to weights directory
            shutil.copy(alt_weights_file, weights_file)
            logger.info(f"Copied weights file from {alt_weights_file} to {weights_file}")
        else:
            # Check in other potential locations
            potential_locations = [
                os.path.join(yolov5_dir, "basket_rim.pt"),
                os.path.join(current_dir, "basket_rim.pt")
            ]
            
            for loc in potential_locations:
                if os.path.exists(loc):
                    shutil.copy(loc, weights_file)
                    logger.info(f"Copied weights file from {loc} to {weights_file}")
                    break
            else:
                logger.error("Could not find weights file in any location")
    else:
        logger.info(f"Weights file already exists at: {weights_file}")
    
    # Make sure YOLOv5 is in Python path
    if yolov5_dir not in sys.path:
        sys.path.insert(0, yolov5_dir)
        logger.info(f"Added YOLOv5 directory to Python path: {yolov5_dir}")
    
    # Verify that YOLOv5 can be imported
    try:
        import yolov5
        logger.info("Successfully imported YOLOv5")
    except ImportError:
        logger.warning("Failed to import YOLOv5 as a package. This is expected if using the detect.py script directly.")
        
        # Check if detect.py exists
        detect_path = os.path.join(yolov5_dir, "detect.py")
        if os.path.exists(detect_path):
            logger.info(f"detect.py file exists at: {detect_path}")
        else:
            logger.error(f"detect.py file not found at: {detect_path}")

if __name__ == "__main__":
    setup_yolov5() 