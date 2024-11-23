import cohere
from typing import Dict, Any
import os
from dotenv import load_dotenv
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from collections import deque
from ..config.chatbot_config import (
    AVAILABLE_COURSES,
    AVAILABLE_DRILLS,
    BASKETBALL_KEYWORDS,
    COACH_PROMPT_TEMPLATE
)

# Load environment variables from .env file
load_dotenv()

# Get API key from .env file
API_KEY = os.getenv('API_KEY')
co = cohere.Client(API_KEY)

@dataclass
class ChatResponse:
    text: str
    timestamp: datetime
    query: str

# Replace the single chat_history with a dict of histories per user
user_chat_histories = defaultdict(lambda: deque(maxlen=4))

def create_prompt(user_query: str, user_data: Dict[str, Any]) -> str:
    """Create a structured prompt combining context and query"""
    prompt = COACH_PROMPT_TEMPLATE.format(
        height=user_data.get('height', 'Not provided'),
        vertical_jump=user_data.get('vertical_jump', 'Not provided'),
        form_shooting_score=user_data.get('drill_scores', {}).get('Form Shooting Close Range', 0),
        corner_three_score=user_data.get('drill_scores', {}).get('Corner Three Challenge', 0),
        user_query=user_query,
        available_drills=", ".join(AVAILABLE_DRILLS),
        available_courses=", ".join(AVAILABLE_COURSES)
    )
    return prompt

def get_chatbot_response(user_query: str, user_data: Dict[str, Any]) -> str:
    user_id = user_data.get('user_id')
    if not user_id:
        raise ValueError("user_id is required in user_data")

    if not any(keyword in user_query.lower() for keyword in BASKETBALL_KEYWORDS):
        return "Please ask me basketball-relevant questions. I'm here to help you improve your game!"

    prompt = COACH_PROMPT_TEMPLATE.format(
        height=user_data.get('height'),
        vertical_jump=user_data.get('vertical_jump'),
        form_shooting_score=user_data.get('drill_scores', {}).get('Form Shooting Close Range', 0),
        corner_three_score=user_data.get('drill_scores', {}).get('Corner Three Challenge', 0),
        user_query=user_query,
        available_drills=", ".join(AVAILABLE_DRILLS),
        available_courses=", ".join(AVAILABLE_COURSES)
    )

    try:
        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=250,
            temperature=0.7,
            k=0,
            stop_sequences=[],
            return_likelihoods='NONE'
        )
        
        response_text = response.generations[0].text.strip()
        
        # Store the response in user-specific history
        user_chat_histories[user_id].append(ChatResponse(
            text=response_text,
            timestamp=datetime.now(),
            query=user_query
        ))
        
        return response_text

    except Exception as e:
        print(f"Error: {str(e)}")
        return "Error generating response. Please try again."

# Update utility functions to be user-specific
def get_chat_history(user_id: str) -> list:
    """Return the last 4 chat responses for a specific user"""
    return list(user_chat_histories.get(user_id, []))

def clear_chat_history(user_id: str) -> None:
    """Clear the chat history for a specific user"""
    if user_id in user_chat_histories:
        user_chat_histories[user_id].clear()
