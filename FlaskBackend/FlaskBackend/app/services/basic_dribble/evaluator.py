from functools import lru_cache

@lru_cache(maxsize=1024)
def _cached_evaluate(back_angle, knee_angle, head_tilt_angle, leg_width, ball_y, waist_y, margin):
    """Cached version of the evaluation logic"""
    results = {}
    results['back'] = evaluate_back_angle(back_angle)
    results['knees'] = evaluate_knee_angle(knee_angle)
    results['head'] = evaluate_head_position(head_tilt_angle)
    results['legs'] = evaluate_leg_width(leg_width)
    results['ball'] = evaluate_ball_height(ball_y, waist_y, margin)
    return results

def evaluate_drill(features):
    """
    Evaluate the drill based on extracted features.
    """
    return _cached_evaluate(
        round(features['back_angle'], 1),
        round(features['knee_angle'], 1),
        round(features['head_tilt_angle'], 1),
        round(features['leg_width'], 3),
        round(features['normalized_ball_y'], 3),
        round(features['normalized_waist_y'], 3),
        round(features['margin'], 3)
    )

def evaluate_back_angle(angle):
    threshold = (130, 180)
    return 'good' if threshold[0] <= angle <= threshold[1] else 'bad'

def evaluate_knee_angle(angle):
    threshold = (80, 100)
    return 'good' if threshold[0] <= angle <= threshold[1] else 'bad'

def evaluate_head_position(head_tilt_angle):
    threshold_angle = 25
    return 'good' if head_tilt_angle <= threshold_angle else 'bad'

def evaluate_leg_width(width):
    threshold = 0.15
    return 'good' if width >= threshold else 'bad'

def evaluate_ball_height(normalized_ball_y, normalized_waist_y, margin):
    min_ball_y = normalized_waist_y - margin
    max_ball_y = normalized_waist_y + margin * 1.5
    return 'good' if min_ball_y <= normalized_ball_y <= max_ball_y else 'bad'
