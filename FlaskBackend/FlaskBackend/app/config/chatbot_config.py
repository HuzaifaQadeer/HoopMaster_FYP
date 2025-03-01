# Available courses and drills
AVAILABLE_COURSES = [
    "Dribbling Course - Beginner - 2 weeks",
    "Dribbling Course - Beginner - 1 month",
    "Dribbling Course - Beginner - 2 months",
    "Dribbling Course - Intermediate - 2 weeks",
    "Dribbling Course - Intermediate - 1 month",
    "Dribbling Course - Intermediate - 2 months",
    "Dribbling Course - Expert - 2 weeks",
    "Dribbling Course - Expert - 1 month",
    "Dribbling Course - Expert - 2 months",
    "Shooting Course - Beginner - 2 weeks",
    "Shooting Course - Beginner - 1 month",
    "Shooting Course - Beginner - 2 months",
    "Shooting Course - Intermediate - 2 weeks",
    "Shooting Course - Intermediate - 1 month",
    "Shooting Course - Intermediate - 2 months",
    "Shooting Course - Expert - 2 weeks",
    "Shooting Course - Expert - 1 month",
    "Shooting Course - Expert - 2 months",
    "Finishing Course - Beginner - 2 weeks",
    "Finishing Course - Beginner - 1 month",
    "Finishing Course - Beginner - 2 months",
    "Finishing Course - Intermediate - 2 weeks",
    "Finishing Course - Intermediate - 1 month",
    "Finishing Course - Intermediate - 2 months",
    "Finishing Course - Expert - 2 weeks",
    "Finishing Course - Expert - 1 month",
    "Finishing Course - Expert - 2 months"
]

AVAILABLE_DRILLS = [
    "Basic Dribble",
    "Cross Over dribble",
    "Behind the Back dribble",
    "Between the legs dribble",
    "Tween Dribble"

    
]

# Basketball keywords for validation
BASKETBALL_KEYWORDS = [
    # Shooting variations
    'shoot', 'shooting', 'shot', 'shots', 'shooter',
    '3 point', '3 pointer', '3pt', 'three point', 'three pointer', 'three-pointer',
    'free throw', 'free-throw', 'freethrow',
    'jump shot', 'jumpshot', 'jumper', "dunk",
    "vertical jump","three pointer", "finishing", "dribbling", "dribble"
    
]

# Chatbot prompt template
COACH_PROMPT_TEMPLATE = """You are an expert basketball coach with deep knowledge of training drills and techniques. Direct personalized advice for the player's question.

Player Profile:
- Height: {height}
- Vertical Jump: {vertical_jump}
- Current Skills:
  * Form Shooting: {form_shooting_score}%
  * Corner Threes: {corner_three_score}%

Question: {user_query}

System Drills Available:
{available_drills}

Training Courses Available:
{available_courses}

Provide a detailed response with:
1. Main Focus Area: Identify the key skill to improve based on the question
2. Recommended Drills (3-4 total):
   - Mix of available system drills and custom drills
   - For each drill, provide specific instructions and tips
3. Recommended Course: Select from available courses that best matches their needs

Note: Provide clear, detailed instructions for each drill regardless of whether it's a system drill or custom drill.""" 