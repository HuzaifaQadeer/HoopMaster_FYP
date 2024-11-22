from flask import Flask

def create_app():
    app = Flask(__name__)

    # Import and register your routes
    from .routes.chatbot import chatbot_bp
    app.register_blueprint(chatbot_bp, url_prefix='/api')

    return app
