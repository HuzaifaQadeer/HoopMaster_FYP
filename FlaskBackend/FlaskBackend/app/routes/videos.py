from flask import Blueprint, current_app, send_from_directory
import os

# Define the blueprint with the name "videos_bp"
videos_bp = Blueprint('videos', __name__)

@videos_bp.route('/uploads/processed_videos/<filename>', methods=['GET'])
def get_video(filename):
    # Retrieve the folder path from the configuration
    folder = current_app.config.get('OUTPUT_FOLDER')
    if not folder:
        return "Output folder not configured", 500
    return send_from_directory(folder, filename)
