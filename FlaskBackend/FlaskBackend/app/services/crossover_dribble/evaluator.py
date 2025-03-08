# drills/crossover_dribble/evaluator.py

# Evaluate the crossover dribble for a single frame.
def evaluate_frame(features, frame_time, switch_times, previous_hand_side, hand_side_history):

    results = {}

    forward_lean_angle = features['forward_lean_angle']
    if 0 <= forward_lean_angle <= 60:
        results['Body Lean'] = 'Good'
    else:
        results['Body Lean'] = 'Lean forward with a straight back'


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

    current_hand_side = estimate_ball_hand(features)
    hand_side_history.append(current_hand_side)
    if len(hand_side_history) > 5:
        hand_side_history.pop(0)


    hand_side = max(set(hand_side_history), key=hand_side_history.count)

    if previous_hand_side is not None and hand_side != previous_hand_side:
        # Ball switch detected
        if switch_times:
            switch_interval = frame_time - switch_times[-1]
            switch_times.append(frame_time)
        else:
            switch_times.append(frame_time)
            switch_interval = 0
        switch_count = len(switch_times)
        if switch_count > 1:
            total_time = switch_times[-1] - switch_times[0]
            average_switch_time = total_time / (switch_count - 1)
        else:
            average_switch_time = 0
        results['Ball Switch'] = f"Switches: {switch_count}/15, Avg Time: {average_switch_time:.2f}s"
    else:
       # no ball switch detected
        if switch_times:
            switch_count = len(switch_times)
            if switch_count > 1:
                total_time = switch_times[-1] - switch_times[0]
                average_switch_time = total_time / (switch_count - 1)
            else:
                average_switch_time = 0
            results['Ball Switch'] = f"Switches: {switch_count}/15, Avg Time: {average_switch_time:.2f}s"
        else:
            results['Ball Switch'] = "Switches: 0/15"

    return results, switch_times, hand_side, hand_side_history

# Function to Estimate which hand is controlling the ball based on wrist positions.
def estimate_ball_hand(features):
    left_wrist = features['left_wrist']
    right_wrist = features['right_wrist']
    left_shoulder = features['left_shoulder']
    right_shoulder = features['right_shoulder']


    if left_wrist[1] > right_wrist[1] + 20:

        return 'left'
    elif right_wrist[1] > left_wrist[1] + 20:

        return 'right'
    else:

        left_extension = abs(left_wrist[0] - left_shoulder[0])
        right_extension = abs(right_wrist[0] - right_shoulder[0])
        if left_extension > right_extension:
            return 'left'
        else:
            return 'right'
