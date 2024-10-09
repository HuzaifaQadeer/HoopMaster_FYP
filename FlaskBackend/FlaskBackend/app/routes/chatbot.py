from flask import Blueprint, jsonify, request
from app.services.chatbot_service import ChatbotService

bp = Blueprint('chatbot', __name__, url_prefix='/chatbot')

@bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    response = ChatbotService.get_response(message)
    return jsonify({'response': response})
