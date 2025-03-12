from flask import Blueprint, jsonify, request, current_app, url_for
from app.services.practice_analysis_service import PracticeAnalysisService
import os
import threading
import uuid
import time
import logging
import importlib
import sys
import traceback
import requests
import json

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[logging.FileHandler("practice_analysis.log"), 
                             logging.StreamHandler()])
logger = logging.getLogger(__name__)

bp = Blueprint('practice_analysis', __name__)

# Add: Test route for debugging
@bp.route('/test', methods=['GET'])
def test_route():
    logger.info("Test route accessed")
    return jsonify({"message": "Practice analysis blueprint is working"}), 200

# In-memory storage for tracking analysis jobs
analysis_jobs = {}

@bp.route('/health', methods=['GET'])
def health_check():
    """Simple endpoint to verify the server is responsive"""
    # Count jobs by status
    status_counts = {}
    for job in analysis_jobs.values():
        status = job.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return jsonify({
        "status": "ok",
        "time": time.time(),
        "job_count": len(analysis_jobs),
        "job_status_counts": status_counts
    }), 200

@bp.route('/check-analyzer', methods=['GET'])
def check_analyzer():
    """Check if the shot analyzer can be imported without running it"""
    result = {
        "status": "ok",
        "message": "Shot analyzer check completed",
        "checks": []
    }
    
    # Check if module exists
    try:
        module_path = 'app.services.shot_analyzer.shot_analyzer'
        result["checks"].append({
            "check": "Module import",
            "status": "started"
        })
        
        # Try to import the module without running any functions
        module = importlib.import_module(module_path)
        result["checks"].append({
            "check": "Module import",
            "status": "success",
            "message": f"Successfully imported {module_path}"
        })
        
        # Check if getVideoStreams function exists
        result["checks"].append({
            "check": "Function exists",
            "status": "started"
        })
        
        if hasattr(module, 'getVideoStreams'):
            result["checks"].append({
                "check": "Function exists",
                "status": "success",
                "message": "getVideoStreams function exists in module"
            })
        else:
            result["checks"].append({
                "check": "Function exists",
                "status": "failed",
                "message": "getVideoStreams function not found in module"
            })
            result["status"] = "failed"
        
        # List module dependencies
        result["checks"].append({
            "check": "Module dependencies",
            "status": "info",
            "dependencies": [
                {"name": dep, "version": getattr(sys.modules.get(dep, None), "__version__", "unknown")}
                for dep in ["cv2", "numpy", "mediapipe", "matplotlib", "scipy"]
                if dep in sys.modules
            ]
        })
        
    except Exception as e:
        result["status"] = "failed"
        result["message"] = f"Shot analyzer check failed: {str(e)}"
        result["checks"].append({
            "check": "Module import", 
            "status": "failed",
            "error": str(e)
        })
        logger.error(f"Error checking shot analyzer: {str(e)}", exc_info=True)
    
    return jsonify(result), 200 if result["status"] == "ok" else 500

@bp.route('/simple-analyze', methods=['POST'])
def simple_analyze():
    """Simplest possible analyze endpoint for testing"""
    try:
        # Just check if video exists in request
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        # Return immediately with basic info
        return jsonify({
            "message": "Simple analyze endpoint works!",
            "received_file": request.files['video'].filename,
            "time": time.time()
        }), 200
    except Exception as e:
        # Catch ANY exception
        logger.error(f"Error in simple-analyze: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Server error in simple-analyze",
            "error_details": str(e),
            "traceback": traceback.format_exc()
        }), 500

@bp.route('/analyze', methods=['POST'])
def analyze_practice():
    """Process a video for practice analysis synchronously"""
    try:
        # Immediately log that we received the request
        logger.info("Received request to /practice/analyze")
        
        # Basic validation
        if 'video' not in request.files:
            logger.warning("No video file in request")
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            logger.warning("Empty filename in request")
            return jsonify({"error": "Empty filename"}), 400
        
        # Generate job ID first before any heavy operations
        job_id = str(uuid.uuid4())
        logger.info(f"Created job ID {job_id} for file {video_file.filename}")
        
        # Initialize job tracking
        analysis_jobs[job_id] = {
            "status": "initializing",
            "created_at": time.time(),
            "filename": video_file.filename,
            "updates": ["Job created, initializing"]
        }
        
        # Save file in a try block
        try:
            # Create directory if needed
            upload_folder = current_app.config.get('UPLOAD_FOLDER')
            os.makedirs(upload_folder, exist_ok=True)
            
            # Save file
            temp_path = os.path.join(upload_folder, f"{job_id}_{video_file.filename}")
            video_file.save(temp_path)
            logger.info(f"Video saved to {temp_path}")
            
            # Update job status
            update_job_status(job_id, "processing", f"Video saved to {temp_path}")
        except Exception as file_error:
            logger.error(f"Error saving video file: {str(file_error)}", exc_info=True)
            update_job_status(job_id, "failed", f"Error saving video: {str(file_error)}")
            return jsonify({
                "error": "Failed to save video file",
                "job_id": job_id,
                "status": "failed",
                "details": str(file_error)
            }), 500
        
        # Process video synchronously
        try:
            logger.info(f"Starting synchronous processing for job {job_id}")
            start_time = time.time()
            
            # Open the saved file
            with open(temp_path, 'rb') as f:
                from werkzeug.datastructures import FileStorage
                file_obj = FileStorage(
                    stream=f,
                    filename=os.path.basename(temp_path),
                    content_type='video/mp4'
                )
                
                logger.info(f"Job {job_id}: Calling analyze_practice_video")
                
                # Process the video
                output_video_path, analysis_text = PracticeAnalysisService.analyze_practice_video(file_obj)
                
                elapsed_time = time.time() - start_time
                logger.info(f"Job {job_id}: Analysis completed in {elapsed_time:.2f} seconds")
                
                # Clean up temporary file
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                        logger.info(f"Cleaned up temporary file {temp_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temporary file {temp_path}: {str(cleanup_error)}")
                
                # If no output video was generated, return just the analysis
                if output_video_path is None:
                    return jsonify({
                        "analysis": analysis_text,
                    }), 200
                
                # Verify the output video exists and has content
                if not os.path.exists(output_video_path) or os.path.getsize(output_video_path) == 0:
                    logger.error(f"Output video file is missing or empty: {output_video_path}")
                    return jsonify({
                        "analysis": analysis_text,
                        "error": "Video processing completed but output file is missing or empty"
                    }), 200
                
                # Otherwise, include both analysis and video URL
                video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
                logger.info(f"Returning video URL: {video_url}")
                
                # Verify the video file is valid and accessible
                try:
                    file_size = os.path.getsize(output_video_path)
                    logger.info(f"Video file size: {file_size} bytes")
                    
                    # Check if file is too large (over 100MB)
                    if file_size > 100 * 1024 * 1024:
                        logger.warning(f"Video file is very large: {file_size} bytes")
                except Exception as file_error:
                    logger.error(f"Error checking video file: {str(file_error)}")
                
                # Format response to match dribble analysis output format
                response_data = {
                    "analysis": analysis_text,
                    "video_url": video_url,
                    "status": "success"  # Add status field for consistency
                }
                
                # Log response size for debugging
                response_json = json.dumps(response_data)
                response_size = len(response_json)
                logger.info(f"Response size: {response_size} bytes")
                
                # Check if response is too large (over 10MB)
                if response_size > 10 * 1024 * 1024:
                    logger.warning(f"Response is very large ({response_size} bytes), this might cause issues")
                    # Truncate analysis text if it's too large
                    if len(analysis_text) > 1000:
                        logger.warning(f"Truncating analysis text from {len(analysis_text)} items to 1000")
                        response_data["analysis"] = analysis_text[:1000]
                        response_data["truncated"] = True
                
                logger.info("Sending response to client")
                
                # Send the response with explicit CORS headers
                response = jsonify(response_data)
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                
                return response, 200
                
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}", exc_info=True)
            return jsonify({
                "error": "Failed to process video",
                "job_id": job_id,
                "status": "failed",
                "details": str(e),
                "traceback": traceback.format_exc()
            }), 500
        
    except Exception as e:
        # Catch ANY exception that might occur
        logger.error(f"Unexpected error in analyze_practice: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Server error",
            "error_details": str(e),
            "traceback": traceback.format_exc()
        }), 500

def _process_video_in_background(job_id, video_path):
    """Process the video in a background thread with detailed logging."""
    logger.info(f"Background processing started for job {job_id}")
    update_job_status(job_id, "processing", "Video processing has started")
    
    try:
        # Debug logging for timing
        start_time = time.time()
        update_job_status(job_id, "processing", "Loading analysis service")
        
        # Open the saved file
        with open(video_path, 'rb') as f:
            from werkzeug.datastructures import FileStorage
            file_obj = FileStorage(
                stream=f,
                filename=os.path.basename(video_path),
                content_type='video/mp4'
            )
            
            update_job_status(job_id, "processing", "Starting video analysis")
            logger.info(f"Job {job_id}: Calling analyze_practice_video")
            
            # Process the video
            output_video_path, analysis_text = PracticeAnalysisService.analyze_practice_video(file_obj)
            
            elapsed_time = time.time() - start_time
            logger.info(f"Job {job_id}: Analysis completed in {elapsed_time:.2f} seconds")
            update_job_status(job_id, "processing", f"Analysis completed in {elapsed_time:.2f} seconds")
            
            # Update job with results
            if output_video_path is None:
                update_job_status(
                    job_id, 
                    "completed", 
                    "Processing completed without output video",
                    {"analysis": analysis_text}
                )
            else:
                # Otherwise, include both analysis and video URL
                video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
                
                # Create response data
                response_data = {
                    "analysis": analysis_text,
                    "video_url": video_url,
                    "status": "success"
                }
                
                # Log response size for debugging
                response_json = json.dumps(response_data)
                response_size = len(response_json)
                logger.info(f"Background job response size: {response_size} bytes")
                
                # Check if response is too large (over 10MB)
                if response_size > 10 * 1024 * 1024:
                    logger.warning(f"Background job response is very large ({response_size} bytes), this might cause issues")
                    # Truncate analysis text if it's too large
                    if len(analysis_text) > 1000:
                        logger.warning(f"Truncating analysis text from {len(analysis_text)} items to 1000")
                        response_data["analysis"] = analysis_text[:1000]
                        response_data["truncated"] = True
                
                update_job_status(
                    job_id, 
                    "completed", 
                    "Processing completed with output video",
                    response_data
                )
    except Exception as e:
        logger.error(f"Job {job_id}: Error processing video: {str(e)}", exc_info=True)
        update_job_status(job_id, "failed", f"Error processing video: {str(e)}")
    finally:
        # Clean up temporary file
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                logger.info(f"Cleaned up temporary file {video_path}")
        except Exception as cleanup_error:
            logger.warning(f"Failed to clean up temporary file {video_path}: {str(cleanup_error)}")

def update_job_status(job_id, status, message, additional_data=None):
    """Update the status of a job with a new message and timestamp."""
    if job_id in analysis_jobs:
        analysis_jobs[job_id]["status"] = status
        analysis_jobs[job_id]["last_updated"] = time.time()
        analysis_jobs[job_id]["updates"].append({
            "time": time.time(),
            "message": message
        })
        if additional_data:
            analysis_jobs[job_id].update(additional_data)
        logger.info(f"Job {job_id} status updated to '{status}': {message}")

@bp.route('/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get the current status of a job."""
    if job_id not in analysis_jobs:
        return jsonify({"error": "Job not found"}), 404
    
    job = analysis_jobs[job_id]
    
    # Return user-friendly status information
    response = {
        "job_id": job_id,
        "status": job["status"],
        "filename": job["filename"],
        "created_at": job["created_at"],
        "updates": job["updates"]
    }
    
    # Include results if job is completed
    if job["status"] == "completed":
        if "analysis" in job:
            response["analysis"] = job["analysis"]
        if "video_url" in job:
            response["video_url"] = job["video_url"]
    
    return jsonify(response), 200

@bp.route('/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Get just the results of a completed job."""
    if job_id not in analysis_jobs:
        return jsonify({"error": "Job not found"}), 404
    
    job = analysis_jobs[job_id]
    
    if job["status"] != "completed":
        return jsonify({
            "status": job["status"],
            "message": "Analysis is not yet complete"
        }), 202
    
    # Return just the analysis results in the original format
    response = {}
    if "analysis" in job:
        response["analysis"] = job["analysis"]
    if "video_url" in job:
        response["video_url"] = job["video_url"]
    
    # Add status field for consistency
    response["status"] = "success"
    
    # Create response with CORS headers
    resp = jsonify(response)
    resp.headers.add('Access-Control-Allow-Origin', '*')
    resp.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    resp.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return resp, 200
