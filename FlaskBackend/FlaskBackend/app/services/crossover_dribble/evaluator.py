import numpy as np

def evaluate_frame(features_tuple, frame_time, switch_times, previous_hand_side, hand_side_history):
    """
    features_tuple is expected to be a tuple: (features, ball_xy)
    If ball_xy is None, then no ball was detected.
    """
    # Unpack the tuple
    if isinstance(features_tuple, tuple):
        features, ball_xy = features_tuple
    else:
        features = features_tuple
        ball_xy = None

    # If no ball is detected, immediately flag it.
    if ball_xy is None:
        return {"Ball Switch": "No ball detected"}, switch_times, previous_hand_side, hand_side_history

    results = {}

    # Evaluate body lean.
    forward_lean_angle = features['forward_lean_angle']
    if 0 <= forward_lean_angle <= 60:
        results['Body Lean'] = 'Good'
    else:
        results['Body Lean'] = 'Lean forward with a straight back'

    # Evaluate foot placement.
    average_knee_angle = features['average_knee_angle']
    normalized_leg_separation = features['normalized_leg_separation']
    if average_knee_angle <= 160:
        knee_evaluation = 'Good'
    else:
        knee_evaluation = 'Bend your knees more'
    if normalized_leg_separation >= 0.5:
        leg_evaluation = 'Good'
    else:
        leg_evaluation = 'Keep your feet shoulder-width apart'
    if knee_evaluation == 'Good' and leg_evaluation == 'Good':
        results['Foot Placement'] = 'Good'
    else:
        foot_feedback = []
        if knee_evaluation != 'Good':
            foot_feedback.append(knee_evaluation)
        if leg_evaluation != 'Good':
            foot_feedback.append(leg_evaluation)
        results['Foot Placement'] = ', '.join(foot_feedback)

    # Estimate which hand is controlling the ball.
    current_hand_side = estimate_ball_hand(features)
    if current_hand_side is None:
        results['Ball Switch'] = "No ball detected"
        return results, switch_times, previous_hand_side, hand_side_history

    # Update hand side history.
    hand_side_history.append(current_hand_side)
    if len(hand_side_history) > 5:
        hand_side_history.pop(0)

    # Compute stable hand via majority vote over the last 3 values.
    if len(hand_side_history) >= 3:
        recent = hand_side_history[-3:]
        stable_hand = max(set(recent), key=recent.count)
    else:
        stable_hand = current_hand_side

    # Count a switch only when the stable hand changes.
    if previous_hand_side is not None and stable_hand != previous_hand_side:
        switch_times.append(frame_time)
        switch_count = len(switch_times)
        if switch_count > 1:
            total_time = switch_times[-1] - switch_times[0]
            average_switch_time = total_time / (switch_count - 1)
        else:
            average_switch_time = 0
        results['Ball Switch'] = f"Switches: {switch_count}/15, Avg Time: {average_switch_time:.2f}s"
        new_previous_hand = stable_hand
    else:
        switch_count = len(switch_times) if switch_times else 0
        if switch_count > 1:
            total_time = switch_times[-1] - switch_times[0]
            average_switch_time = total_time / (switch_count - 1)
        else:
            average_switch_time = 0
        results['Ball Switch'] = f"Switches: {switch_count}/15, Avg Time: {average_switch_time:.2f}s"
        new_previous_hand = previous_hand_side if previous_hand_side is not None else stable_hand

    return results, switch_times, new_previous_hand, hand_side_history

def estimate_ball_hand(features):
    left_wrist = features['left_wrist']
    right_wrist = features['right_wrist']
    left_shoulder = features['left_shoulder']
    right_shoulder = features['right_shoulder']

    # If wrists are nearly identical, assume no ball is detected.
    if np.linalg.norm(left_wrist - right_wrist) < 20:
        return None

    if left_wrist[1] > right_wrist[1] + 20:
        return 'left'
    elif right_wrist[1] > left_wrist[1] + 20:
        return 'right'
    else:
        left_extension = abs(left_wrist[0] - left_shoulder[0])
        right_extension = abs(right_wrist[0] - right_shoulder[0])
        return 'left' if left_extension > right_extension else 'right'
