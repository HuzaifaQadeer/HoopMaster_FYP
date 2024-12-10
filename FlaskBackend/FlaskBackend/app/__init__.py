from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    
    # Add configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
    app.config['PROCESSED_FOLDER'] = os.path.join(app.root_path, 'processed')

    # Import and register your routes
    from .routes.drill_assessment import drill_assessment_bp
    from .routes.chatbot import chatbot_bp

    app.register_blueprint(chatbot_bp, url_prefix='/api')
    app.register_blueprint(drill_assessment_bp, url_prefix='/drill-assessment')

    return app