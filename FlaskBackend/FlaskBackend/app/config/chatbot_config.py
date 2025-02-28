# Available courses and drills
AVAILABLE_COURSES = [
    "Three-Point Mastery",
    "Mid-Range Maestro",
    "Layup Master",
    "Dribbling Fundamentals",
    "Advanced Handles"
]

AVAILABLE_DRILLS = [
    "Basic dribble",
    "Crossover dribble",
    "Behind the back dribble",
    "Tween dribble",
    "Between the legs dribble",
    "Crossover Series"
]

# Basketball keywords for validation
BASKETBALL_KEYWORDS = [
    # Shooting variations
    'shoot', 'shooting', 'shot', 'shots', 'shooter',
    '3 point', '3 pointer', '3pt', 'three point', 'three pointer', 'three-pointer',
    'free throw', 'free-throw', 'freethrow',
    'jump shot', 'jumpshot', 'jumper',
    
    # Dribbling variations
    'dribble', 'dribbling', 'handles', 'ball handling', 'ball-handling',
    'crossover', 'cross-over', 'between the legs', 'behind the back',
    
    # Defensive terms
    'defense', 'defensive', 'defend', 'defending',
    'steal', 'block', 'rebound', 'rebounding',
    'stance', 'sliding', 'closeout',
    
    # Offensive moves
    'layup', 'lay-up', 'lay up', 'layups',
    'dunk', 'dunking', 'dunks',
    'post up', 'post-up', 'post move',
    'euro step', 'eurostep', 'euro-step',
    'floater', 'hook shot', 'bank shot',
    
    # Physical attributes
    'jump', 'jumping', 'vertical', 'vertical leap',
    'speed', 'agility', 'quickness', 'strength',
    'footwork', 'balance', 'coordination',
    
    # Training terms
    'drill', 'drills', 'practice', 'practicing',
    'training', 'workout', 'workouts', 'exercise',
    'conditioning', 'cardio', 'endurance',
    'warmup', 'warm-up', 'warm up',
    'stretch', 'stretching', 'flexibility',
    
    # Game terms
    'game', 'games', 'scrimmage', 'pickup', 'pick-up',
    'basketball', 'hoops', 'ball', 'court',
    'offense', 'offensive', 'scoring', 'score',
    
    # People and organizations
    'nba', 'ncaa', 'fiba',
    'coach', 'coaching', 'trainer',
    'player', 'players', 'teammate',
    'team', 'teams', 'squad',
    
    # Skill development
    'skill', 'skills', 'technique',
    'fundamentals', 'basics', 'advanced',
    'form', 'mechanics', 'rhythm',
    'improvement', 'progress', 'development'
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