import cohere
from typing import Dict, Any
import os
from dotenv import load_dotenv
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from collections import deque

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

def format_context(user_data: Dict[str, Any]) -> str:
    """Format user physical stats and progress data"""
    context = f"""
    Physical Stats:
    - Height: {user_data.get('height', 'Not provided')}
    - Weight: {user_data.get('weight', 'Not provided')}
    - Wingspan: {user_data.get('wingspan', 'Not provided')}
    - Vertical Jump: {user_data.get('vertical_jump', 'Not provided')}
    
    Current Courses:
    {format_current_courses(user_data.get('current_courses', {}))}
    
    Completed Courses:
    {format_completed_courses(user_data.get('completed_courses', {}))}
    
    Recent Drill Performance:
    {format_drill_performance(user_data.get('drill_scores', {}))}
    """
    return context

def format_current_courses(courses: Dict) -> str:
    if not courses:
        return "No active courses"
    
    formatted = []
    for course, details in courses.items():
        formatted.append(f"- {course} (Level: {details['level']}, Schedule: {details['schedule']}, Progress: {details['completion']}%)")
    return "\n".join(formatted)

def format_completed_courses(courses: Dict) -> str:
    """Format completed courses data"""
    if not courses:
        return "No completed courses"
    
    formatted = []
    for course, details in courses.items():
        formatted.append(f"- {course} (Level: {details['level']}, Completion: {details['completion']}%)")
    return "\n".join(formatted)

def format_drill_performance(drill_scores: Dict) -> str:
    if not drill_scores:
        return "No recent drill scores"
    
    formatted = []
    for drill, score in drill_scores.items():
        formatted.append(f"- {drill}: {score}% mastery")
    return "\n".join(formatted)

def create_prompt(user_query: str, user_data: Dict[str, Any]) -> str:
    """Create a structured prompt combining context and query"""
    context = format_context(user_data)
    
    prompt = f"""You are an experienced basketball coach and trainer. Use the following information about the player to provide personalized advice.

    {context}

    Based on this information and your knowledge as a coach, please answer the following question:
    {user_query}

    Provide specific recommendations including:
    - Appropriate course selections from our program
    - Specific drill targets
    - Relevant exercise routines
    - Safety considerations
    - Timeline for improvement
    """
    return prompt

def get_chatbot_response(user_query: str, user_data: Dict[str, Any]) -> str:
    # Get user_id from user_data
    user_id = user_data.get('user_id')
    if not user_id:
        raise ValueError("user_id is required in user_data")

    # Simplified basketball keywords for faster checking
    basketball_keywords = ['shoot', 'dribble', 'defense', 'layup', 'jump', 'drill', 'practice', 'game', 'basketball', 'nba', 'strech', 'skill', 'training', 'workout', 'coach', 'player', 'team', 'score', 'ball handling', 'crossover', 'pivot', 'footwork', 'conditioning']
    
    if not any(keyword in user_query.lower() for keyword in basketball_keywords):
        return "Please ask me basketball-relevant questions. I'm here to help you improve your game!"

    prompt = f"""You are a basketball coach. Direct advice for player's question.

    Player: {user_data.get('height')} tall, {user_data.get('vertical_jump')} vertical.
    Skills: Form Shooting ({user_data.get('drill_scores', {}).get('Form Shooting Close Range', 0)}%), Corner Threes ({user_data.get('drill_scores', {}).get('Corner Three Challenge', 0)}%)

    Question: {user_query}

    Available Drills:
    Form Shooting Close Range, Corner Three Challenge, Mid-Range Elbow Shots, Mikan Drill, Two-Ball Dribbling, Crossover Series

    Available Courses:
    Three-Point Mastery, Mid-Range Maestro, Layup Master, Dribbling Fundamentals, Advanced Handles

    Provide:
    1. Main focus
    2. 2-3 drills with targets
    3. Timeline
    4. Next course"""

    try:
        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=250,  # Reduced from 300
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
