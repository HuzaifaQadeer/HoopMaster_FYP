import os
from pathlib import Path
import cv2
from flask import Blueprint, request, jsonify, send_file, current_app

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
    
    # Save input video
    video_file.save(input_path)
    
    try:
        # Process the video using the imported function
        process_basic_dribble_video(str(input_path), str(output_path))
        
        # Send the processed video file
        response = send_file(output_path, as_attachment=True, download_name=f"processed_{video_file.filename}")
        
        # Clean up the output file after sending
        @response.call_on_close
        def cleanup():
            if output_path.exists():
                os.remove(output_path)
            if input_path.exists():
                os.remove(input_path)
                
        return response
        
    except Exception as e:
        # Clean up on error
        if input_path.exists():
            os.remove(input_path)
        if output_path.exists():
            os.remove(output_path)
        return jsonify({'error': str(e)}), 500
