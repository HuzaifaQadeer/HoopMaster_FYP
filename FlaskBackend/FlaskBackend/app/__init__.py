from flask import Flask
import os
from flask_cors import CORS  # Import CORS

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin"]
        }
    })
    
    # Configure paths for uploads with two subfolders
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads', 'original_videos')
    app.config['OUTPUT_FOLDER'] = os.path.join(app.root_path, 'uploads', 'processed_videos')

    # Import and register your blueprints
    from .routes.chatbot import chatbot_bp
    from .routes.dribble_analysis import dribble_bp
    from .routes.videos import videos_bp  # New blueprint to serve videos

    app.register_blueprint(chatbot_bp, url_prefix='/api')
    app.register_blueprint(dribble_bp, url_prefix='/api/dribble')
    app.register_blueprint(videos_bp)  # No prefix, the route already includes '/uploads/processed_videos/'

    return app
