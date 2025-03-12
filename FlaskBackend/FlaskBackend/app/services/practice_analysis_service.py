from flask import current_app
import os
import uuid
import time
import threading
import logging
import cv2
import shutil
import sys

# Configure logging
logger = logging.getLogger(__name__)

# Global lock for model loading
model_lock = threading.Lock()
# Flag to track if models are loaded
models_loaded = False

class PracticeAnalysisService:
    @staticmethod
    def analyze_practice_video(video_file):
        """
        Analyzes a basketball practice video using the shot analyzer.
        
        Args:
            video_file: The uploaded video file
            
        Returns:
            A tuple containing (output_video_path, analysis_text)
        """
        global models_loaded
        
        try:
            logger.info("Starting practice video analysis")
            analysis_start = time.time()
            
            # Create upload and output directories if they don't exist
            upload_folder = current_app.config.get('UPLOAD_FOLDER')
            output_folder = current_app.config.get('OUTPUT_FOLDER')
            os.makedirs(upload_folder, exist_ok=True)
            os.makedirs(output_folder, exist_ok=True)
            
            # Save the uploaded video to a temporary file
            input_path = os.path.join(upload_folder, f"{uuid.uuid4()}_{video_file.filename}")
            video_file.save(input_path)
            logger.info(f"Video saved to {input_path}")
            
            # Create output path for processed video
            output_filename = f"processed_{os.path.basename(input_path)}"
            output_path = os.path.join(output_folder, output_filename)
            
            # Load models only once across all requests
            load_start = time.time()
            logger.info("Starting to load or get YOLO models")
            with model_lock:
                if not models_loaded:
                    # This will ensure models are loaded only once
                    logger.info("YOLO models not loaded yet, loading now...")
                    import_start = time.time()
                    
                    # Set up YOLOv5 path properly - do this before importing
                    shot_analyzer_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                                    "shot_analyzer")
                    yolov5_dir = os.path.join(shot_analyzer_dir, "yolov5")
                    
                    if os.path.exists(yolov5_dir):
                        logger.info(f"Found YOLOv5 directory at: {yolov5_dir}")
                        # Add to Python path if not already there
                        if yolov5_dir not in sys.path:
                            sys.path.insert(0, yolov5_dir)
                            logger.info(f"Added YOLOv5 to Python path: {yolov5_dir}")
                            
                        # Also add parent directory to Path
                        if shot_analyzer_dir not in sys.path:
                            sys.path.insert(0, shot_analyzer_dir)
                            logger.info(f"Added shot_analyzer to Python path: {shot_analyzer_dir}")
                    
                    # Run setup script first to ensure YOLOv5 is properly initialized
                    try:
                        logger.info("Running YOLOv5 setup script")
                        from app.services.shot_analyzer.setup import setup_yolov5
                        setup_yolov5()
                        
                        # After setup is complete, check path again
                        if yolov5_dir not in sys.path:
                            sys.path.insert(0, yolov5_dir)
                            logger.info(f"Re-added YOLOv5 to Python path after setup: {yolov5_dir}")
                        
                        # Now import the shot analyzer - ensure it's imported after the path setup
                        from app.services.shot_analyzer.shot_analyzer import getVideoStreams
                        import_end = time.time()
                        logger.info(f"Import took {import_end - import_start:.2f} seconds")
                        models_loaded = True
                        logger.info("YOLO models loaded successfully")
                    except Exception as setup_error:
                        logger.error(f"Error during YOLOv5 setup: {str(setup_error)}", exc_info=True)
                        # Try to import anyway - it might work with the fallback detection
                        try:
                            from app.services.shot_analyzer.shot_analyzer import getVideoStreams
                            logger.warning("Imported shot_analyzer with potential fallback detection")
                            models_loaded = True
                        except Exception as import_error:
                            logger.error(f"Failed to import shot_analyzer: {str(import_error)}", exc_info=True)
                            raise
                else:
                    # Models already loaded, just import the function
                    logger.info("YOLO models already loaded, reusing")
                    from app.services.shot_analyzer.shot_analyzer import getVideoStreams
            load_end = time.time()
            logger.info(f"Model loading phase took {load_end - load_start:.2f} seconds")
            
            # Process the video using the shot analyzer
            process_start = time.time()
            logger.info(f"Starting video stream analysis for {input_path}")
            
            try:
                logger.info("Calling getVideoStreams function")
                shooting_time, release_angle, make_or_miss, knee_angles, elbow_angles, fps, analyzer_output_path = getVideoStreams(input_path)
                logger.info("getVideoStreams function returned successfully")
            except Exception as e:
                logger.error(f"Error in getVideoStreams: {str(e)}", exc_info=True)
                raise
                
            process_end = time.time()
            processing_time = process_end - process_start
            logger.info(f"Video processing took {processing_time:.2f} seconds")
            
            # Generate analysis text
            logger.info("Generating analysis text")
            analysis_text = PracticeAnalysisService._generate_analysis_text(
                shooting_time, release_angle, make_or_miss, knee_angles, elbow_angles, processing_time
            )
            
            # Clean up the input file to save space
            try:
                os.remove(input_path)
                logger.info(f"Removed input file {input_path}")
            except Exception as e:
                logger.warning(f"Failed to remove input file: {str(e)}")
            
            # Move the output video to the expected location
            logger.info(f"Using analyzer output path: {analyzer_output_path}")
            
            if os.path.exists(analyzer_output_path):
                logger.info(f"Found output video at {analyzer_output_path}, moving to {output_path}")
                
                # Verify the video file is valid before moving it
                try:
                    # Check if the file can be opened with OpenCV
                    cap = cv2.VideoCapture(analyzer_output_path)
                    if not cap.isOpened():
                        logger.warning(f"Output video file cannot be opened with OpenCV: {analyzer_output_path}")
                        # Try to convert the video to a more compatible format
                        try:
                            logger.info("Attempting to convert video to a more compatible format")
                            temp_output = f"{analyzer_output_path}_converted.mp4"
                            
                            # Use OpenCV to convert the video
                            input_cap = cv2.VideoCapture(analyzer_output_path)
                            if input_cap.isOpened():
                                # Get video properties
                                width = int(input_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                                height = int(input_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                                fps = input_cap.get(cv2.CAP_PROP_FPS)
                                
                                # Create VideoWriter with H.264 codec
                                fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Use mp4v codec for better compatibility
                                out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))
                                
                                # Process frame by frame
                                while True:
                                    ret, frame = input_cap.read()
                                    if not ret:
                                        break
                                    out.write(frame)
                                
                                # Release resources
                                input_cap.release()
                                out.release()
                                
                                # Use the converted file
                                if os.path.exists(temp_output) and os.path.getsize(temp_output) > 0:
                                    logger.info(f"Successfully converted video to {temp_output}")
                                    analyzer_output_path = temp_output
                                else:
                                    logger.warning(f"Conversion failed, output file is missing or empty: {temp_output}")
                            else:
                                logger.warning("Could not open input video for conversion")
                        except Exception as conv_error:
                            logger.error(f"Error converting video: {str(conv_error)}")
                    else:
                        # Check video properties
                        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        fps = cap.get(cv2.CAP_PROP_FPS)
                        
                        logger.info(f"Video properties: {frame_count} frames, {width}x{height} @ {fps} fps")
                        cap.release()
                except Exception as verify_error:
                    logger.error(f"Error verifying video file: {str(verify_error)}")
                
                # Move the file to the output location
                os.rename(analyzer_output_path, output_path)
                logger.info(f"Moved output video to {output_path}")
            else:
                logger.warning(f"Output video not found at {analyzer_output_path}, checking alternative locations")
                
                # Try common fallback locations
                shot_analyzer_output = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                                   "services", "shot_analyzer", "output", "output_video.mp4")
                if os.path.exists(shot_analyzer_output):
                    logger.info(f"Found output video at fallback location, moving to {output_path}")
                    os.rename(shot_analyzer_output, output_path)
                else:
                    logger.warning("No output video found, returning None for video path")
                    output_path = None
            
            analysis_end = time.time()
            total_time = analysis_end - analysis_start
            logger.info(f"Total analysis time: {total_time:.2f} seconds")
            
            return output_path, analysis_text
            
        except Exception as e:
            logger.error(f"Error in analyze_practice_video: {str(e)}", exc_info=True)
            # Clean up on error
            if 'input_path' in locals() and os.path.exists(input_path):
                try:
                    os.remove(input_path)
                except:
                    pass
            raise Exception(f"Error analyzing practice video: {str(e)}")
    
    @staticmethod
    def _generate_analysis_text(shooting_time, release_angle, make_or_miss, knee_angles, elbow_angles, processing_time=None):
        """
        Generates detailed analysis text based on shot metrics with raw data included
        """
        # Create a list to store analysis lines
        analysis = []
        
        # Include processing time information for debugging
        if processing_time is not None:
            analysis.append(f"Analysis completed in {processing_time:.2f} seconds")
        
        # Count detected shots from various metrics
        detected_shots = max(len(make_or_miss), len(release_angle), len(knee_angles), len(elbow_angles))
        
        # If we have at least one shot detected from any metric, we can provide analysis
        if detected_shots > 0:
            # Count made shots (either "Make" strings or True values)
            made_shots = sum(1 for result in make_or_miss if result == "Make" or result is True)
            
            # If no make/miss data but we have shots, set reasonable default
            if len(make_or_miss) == 0 and detected_shots > 0:
                # Estimate made shots based on typical shooting percentage
                made_shots = int(detected_shots * 0.5)  # Assume 50% success rate
                analysis.append("Note: Shot make/miss detection was unreliable. Using estimated values.")
            
            total_shots = max(len(make_or_miss), 1)  # Avoid division by zero
            shooting_percentage = (made_shots / total_shots) * 100
            
            # Add Stats header with empty line for spacing
            analysis.append("")  # Empty line for spacing
            analysis.append("=== STATS ===")
            analysis.append(f"Total Shots: {detected_shots}")
            analysis.append(f"Made Shots: {made_shots}")
            analysis.append(f"Shooting Percentage: {shooting_percentage:.1f}%")
            
            # Include detailed metrics with fallback values if needed
            if len(release_angle) > 0:
                # Filter out unreasonable values (e.g., angles > 90 degrees are likely errors)
                valid_angles = [angle for angle in release_angle if 0 <= angle <= 90]
                
                if valid_angles:
                    avg_release_angle = sum(valid_angles) / len(valid_angles)
                    min_release_angle = min(valid_angles)
                    max_release_angle = max(valid_angles)
                    analysis.append(f"Release Angle: {avg_release_angle:.1f}° (Min: {min_release_angle:.1f}°, Max: {max_release_angle:.1f}°)")
                else:
                    # Use typical values as fallback
                    analysis.append("Release Angle: ~45° (estimated)")
            else:
                # Use typical values as fallback
                analysis.append("Release Angle: ~45° (estimated)")
            
            if len(knee_angles) > 0:
                # Filter out unreasonable values
                valid_knee = [angle for angle in knee_angles if 0 <= angle <= 180]
                
                if valid_knee:
                    avg_knee_angle = sum(valid_knee) / len(valid_knee)
                    min_knee_angle = min(valid_knee)
                    max_knee_angle = max(valid_knee)
                    analysis.append(f"Knee Angle: {avg_knee_angle:.1f}° (Min: {min_knee_angle:.1f}°, Max: {max_knee_angle:.1f}°)")
                else:
                    # Use typical values as fallback
                    analysis.append("Knee Angle: ~130° (estimated)")
            else:
                # Use typical values as fallback
                analysis.append("Knee Angle: ~130° (estimated)")
            
            if len(elbow_angles) > 0:
                # Filter out unreasonable values
                valid_elbow = [angle for angle in elbow_angles if -90 <= angle <= 90]
                
                if valid_elbow:
                    avg_elbow_angle = sum(valid_elbow) / len(valid_elbow)
                    min_elbow_angle = min(valid_elbow)
                    max_elbow_angle = max(valid_elbow)
                    analysis.append(f"Elbow Angle: {avg_elbow_angle:.1f}° (Min: {min_elbow_angle:.1f}°, Max: {max_elbow_angle:.1f}°)")
                else:
                    # Use typical values as fallback
                    analysis.append("Elbow Angle: ~45° (estimated)")
            else:
                # Use typical values as fallback
                analysis.append("Elbow Angle: ~45° (estimated)")
            
            # Shot timing - convert frames to seconds if we have timing data
            if len(shooting_time) > 0:
                valid_times = [time for time in shooting_time if time > 0]
                if valid_times:
                    avg_time = sum(valid_times) / len(valid_times)
                    analysis.append(f"Average Shot Time: {avg_time:.1f} frames")
                else:
                    analysis.append("Average Shot Time: Not available")
            else:
                analysis.append("Average Shot Time: Not available")
                
            # Add shooting analysis and advice with empty line for spacing
            analysis.append("")  # Empty line for spacing
            analysis.append("=== FEEDBACK ===")
            
            # Analyze shooting form based on available data
            feedback = []
            
            if len(valid_angles) > 0:
                if avg_release_angle < 35:
                    feedback.append("Your release angle is flat. Try shooting with a higher arc.")
                elif avg_release_angle > 60:
                    feedback.append("Your release angle is steep. A slightly flatter trajectory may improve accuracy.")
                else:
                    feedback.append("Your release angle is in a good range for consistent shooting.")
                
            if len(valid_knee) > 0:
                if avg_knee_angle < 100:
                    feedback.append("Good knee bend - you're getting power from your legs.")
                elif avg_knee_angle > 150:
                    feedback.append("Try bending your knees more to generate power from your legs.")
                    
            if len(valid_elbow) > 0:
                if avg_elbow_angle < 0:
                    feedback.append("Work on fully extending your shooting arm on release.")
                elif avg_elbow_angle > 60:
                    feedback.append("Your elbow extension is good during your shot.")
            
            # Add feedback with bullet points
            if feedback:
                for point in feedback:
                    analysis.append(f"• {point}")
            
            # Add general shooting advice
            analysis.append("")  # Empty line for spacing
            analysis.append("• For best results: Use consistent form, square your feet to the basket, and follow through.")
            
        else:
            analysis.append("No shots were detected in the video.")
            analysis.append("This may be due to difficulties in detecting the basketball or shot motion.")
            analysis.append("Please try a video with better lighting and clearer shots.")
        
        # Join the analysis lines with newline characters and return as a single string
        return "\n".join(analysis) 