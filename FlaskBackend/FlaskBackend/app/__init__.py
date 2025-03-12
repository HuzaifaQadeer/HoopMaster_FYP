from flask import Flask
import os
from flask_cors import CORS  # Import CORS
import logging
from .logging_config import configure_logging

def create_app():
    # Configure logging first
    configure_logging()
    logger = logging.getLogger(__name__)
    logger.info("Starting Flask application")
    
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin"]
        }
    })
    logger.info("CORS configured")
    
    # Configure paths for uploads with two subfolders
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads', 'original_videos')
    app.config['OUTPUT_FOLDER'] = os.path.join(app.root_path, 'uploads', 'processed_videos')
    logger.info(f"Upload folder: {app.config['UPLOAD_FOLDER']}")
    logger.info(f"Output folder: {app.config['OUTPUT_FOLDER']}")

    # Import and register your blueprints
    from .routes.chatbot import chatbot_bp
    from .routes.dribble_analysis import dribble_bp
    from .routes.videos import videos_bp  # New blueprint to serve videos
    from .routes.practice_analysis import bp as practice_analysis_bp  # Import practice analysis blueprint

    app.register_blueprint(chatbot_bp, url_prefix='/api')
    app.register_blueprint(dribble_bp, url_prefix='/api/dribble')
    app.register_blueprint(videos_bp)  # No prefix, the route already includes '/uploads/processed_videos/'
    app.register_blueprint(practice_analysis_bp, url_prefix='/api/practice')
    logger.info("All blueprints registered")

    # Add: Debug logging for all registered routes
    logger.info("Registered URLs:")
    for rule in app.url_map.iter_rules():
        logger.info(f"{rule.endpoint}: {rule.rule}")

    # Ensure upload directories exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
    logger.info("Upload directories created")

    logger.info("Flask application initialized successfully")
    return app
