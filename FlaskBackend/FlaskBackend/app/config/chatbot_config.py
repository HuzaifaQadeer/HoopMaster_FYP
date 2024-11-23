# Available courses and drills
AVAILABLE_COURSES = [
    "Three-Point Mastery",
    "Mid-Range Maestro",
    "Layup Master",
    "Dribbling Fundamentals",
    "Advanced Handles"
]

AVAILABLE_DRILLS = [
    "Form Shooting Close Range",
    "Corner Three Challenge",
    "Mid-Range Elbow Shots",
    "Mikan Drill",
    "Two-Ball Dribbling",
    "Crossover Series"
]

# Basketball keywords for validation
BASKETBALL_KEYWORDS = [
    'shoot', 'dribble', 'defense', 'layup', 'jump', 'drill', 
    'practice', 'game', 'basketball', 'nba', 'strech', 'skill', 
    'training', 'workout', 'coach', 'player', 'team', 'score', 
    'ball handling', 'crossover', 'pivot', 'footwork', 'conditioning'
]

# Chatbot prompt template
COACH_PROMPT_TEMPLATE = """You are a basketball coach. Direct advice for player's question.

Player: {height} tall, {vertical_jump} vertical.
Skills: Form Shooting ({form_shooting_score}%), Corner Threes ({corner_three_score}%)

Question: {user_query}

Available Drills:
{available_drills}

Available Courses:
{available_courses}

Provide:
1. Main focus
2. 2-3 drills with targets
3. Timeline
4. Next course""" 