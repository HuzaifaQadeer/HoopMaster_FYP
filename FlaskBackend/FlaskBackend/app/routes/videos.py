from flask import Blueprint, current_app, send_file, Response, abort, request, jsonify
import os
import mimetypes

# Define the blueprint with the name "videos_bp"
videos_bp = Blueprint('videos', __name__)

@videos_bp.route('/uploads/processed_videos/<filename>', methods=['GET', 'OPTIONS'])
def get_video(filename):
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response
        
    folder = current_app.config.get('OUTPUT_FOLDER')
    file_path = os.path.join(folder, filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        abort(404, description="Video file not found")
    
    try:
        # Log request details for debugging
        print(f"Serving video: {filename}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"File path: {file_path}")
        
        # Use send_file instead of streaming
        response = send_file(
            file_path,
            mimetype='video/mp4',
            as_attachment=False,
            download_name=filename,
            conditional=True
        )
        
        # Add CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Accept-Ranges', 'bytes')
        response.headers.add('Cache-Control', 'no-store, must-revalidate')
        response.headers.add('Expires', '0')
        
        return response
    except Exception as e:
        print(f"Error serving video: {str(e)}")
        abort(500, description=f"Internal server error: {str(e)}")

# Add a test endpoint to check if the API is accessible
@videos_bp.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "status": "ok",
        "message": "Video API is working"
    })
