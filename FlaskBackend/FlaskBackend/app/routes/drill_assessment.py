import os
from pathlib import Path
import cv2
from flask import Blueprint, request, jsonify, send_file, current_app, after_this_request

from app.services.basic_dribble.process_services import process_basic_dribble_video, overlay_evaluation

drill_assessment_bp = Blueprint('drill_assessment', __name__)

@drill_assessment_bp.route('/basic-dribble', methods=['POST'])
def basic_dribble():
    """
    Process a video file and return the processed video file
    """
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No video selected for uploading"}), 400
    
    # Create directories if they don't exist
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    input_path = Path(current_app.config['UPLOAD_FOLDER']) / f"input_{video_file.filename}"
    output_path = Path(current_app.config['UPLOAD_FOLDER']) / f"processed_{video_file.filename}"
    
    @after_this_request
    def cleanup(response):
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
                current_app.logger.info(f"Successfully deleted processed video: {output_path}")
        except Exception as e:
            current_app.logger.error(f"Error removing processed video: {e}")
        return response
    
    try:
        # Save input video
        video_file.save(input_path)
        
        # Process the video using the imported function
        process_basic_dribble_video(str(input_path), str(output_path))
        
        # Clean up input file as it's no longer needed
        os.remove(input_path)
        
        # Send the processed video file
        return send_file(output_path, as_attachment=True, download_name=f"processed_{video_file.filename}")
        
    except Exception as e:
        # Clean up on error
        if input_path.exists():
            os.remove(input_path)
        if output_path.exists():
            os.remove(output_path)
        return jsonify({'error': str(e)}), 500
