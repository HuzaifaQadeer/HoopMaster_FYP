from flask import Blueprint, jsonify, request, Response
import cv2
from app.services.basic_dribble.video_processor import process_video_frame

bp = Blueprint('drill_assessment', __name__, url_prefix='/drill')

@bp.route('/basic_dribble', methods=['POST'])
def process_video():
    """
    Process a full video file and return the processed video stream
    """
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    temp_path = 'temp_video.mp4'  # You might want to use a more secure temporary file
    video_file.save(temp_path)
    
    def generate_frames():
        cap = cv2.VideoCapture(temp_path)
        frame_count = 0
        processing_interval = 10  # Changed from 5 to 10
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                frame_count += 1
                if frame_count % processing_interval == 0:
                    # Resize frame to reduce processing time
                    resized_frame = cv2.resize(frame, (640, 480))
                    evaluation, annotated_frame = process_video_frame(resized_frame)
                    if evaluation:
                        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        frame_bytes = buffer.tobytes()
                        
                        # Yield the frame in multipart format
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    
        finally:
            cap.release()
            import os
            os.remove(temp_path)
    
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame',
                   timeout=600)  # Increased from 300 to 600 seconds