from flask import Blueprint, request, jsonify
from app.services.chatbot_service import get_chatbot_response

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    user_query = data.get('user_query')
    user_data = data.get('user_data')
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    if not user_data:
        return jsonify({"error": "No user data provided"}), 400
        
    response = get_chatbot_response(user_query, user_data)
    return jsonify({"response": response})
