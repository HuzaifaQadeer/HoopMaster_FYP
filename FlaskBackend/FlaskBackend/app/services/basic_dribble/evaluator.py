
def evaluate_drill(features):
    """
    Evaluate the drill based on extracted features.
    """
    results = {}
    results['back'] = evaluate_back_angle(features['back_angle'])
    results['knees'] = evaluate_knee_angle(features['knee_angle'])
    results['head'] = evaluate_head_position(features['head_tilt_angle'])
    results['legs'] = evaluate_leg_width(features['leg_width'])
    results['ball'] = evaluate_ball_height(features['normalized_ball_y'], features['normalized_waist_y'], features['margin'])
    return results

def evaluate_back_angle(angle):
    threshold = (130, 180)
    return 'good' if threshold[0] <= angle <= threshold[1] else 'bad'

def evaluate_knee_angle(angle):
    threshold = (80, 100)
    return 'good' if threshold[0] <= angle <= threshold[1] else 'bad'

def evaluate_head_position(head_tilt_angle):
    threshold_angle = 25  # degrees, adjust as needed
    return 'good' if head_tilt_angle <= threshold_angle else 'bad'

def evaluate_leg_width(width):
    threshold = 0.15
    return 'good' if width >= threshold else 'bad'

def evaluate_ball_height(normalized_ball_y, normalized_waist_y, margin):
    min_ball_y = normalized_waist_y - margin
    max_ball_y = normalized_waist_y + margin * 1.5  # Allow more leniency below waist
    return 'good' if min_ball_y <= normalized_ball_y <= max_ball_y else 'bad'
