from flask import Flask
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    from app.routes import chatbot, drill_assessment, practice_analysis
    app.register_blueprint(chatbot.bp)
    app.register_blueprint(drill_assessment.bp)
    app.register_blueprint(practice_analysis.bp)

    return app
