import time

def evaluate_back_angle(angle):
    return "good" if 125 <= angle <= 145 else "bad"

def evaluate_knee_angle(angle):
    return "good" if 140 <= angle <= 160 else "bad"

def evaluate_ball_below_waist(ball_y, waist_y):
    if ball_y is None:
        return "bad"
    return "good" if ball_y >= waist_y else "bad"

class BasicDribbleEvaluator:
    def __init__(self):
        self.total_frames = 0
        self.good_back = 0
        self.good_knees = 0
        self.good_ball = 0

        # Ball fallback variables
        self.last_ball_y = None
        self.last_ball_time = None
        self.ball_timeout = 1.0  # up to 1s fallback

    def evaluate_frame(self, features, ball_coords):
        self.total_frames += 1
        result = {}

        back_eval = evaluate_back_angle(features["back_angle"])
        knee_eval = evaluate_knee_angle(features["knee_angle"])
        if back_eval == "good":
            self.good_back += 1
        if knee_eval == "good":
            self.good_knees += 1

        now = time.time()
        final_ball_y = None
        if ball_coords is not None:
            final_ball_y = ball_coords[1]
            self.last_ball_y = final_ball_y
            self.last_ball_time = now
        else:
            if self.last_ball_y is not None and (now - self.last_ball_time) <= self.ball_timeout:
                final_ball_y = self.last_ball_y

        ball_eval = evaluate_ball_below_waist(final_ball_y, features["waist_level"])
        if ball_eval == "good":
            self.good_ball += 1

        result["back"] = back_eval
        result["knees"] = knee_eval
        result["ball"] = ball_eval
        return result

    def evaluate_skipped_frame(self, features):
        if features is None:
            return None
        return self.evaluate_frame(features, None)

    def get_final_feedback(self):
        if self.total_frames < 1:
            return ("No frames processed", 0.0)
        # Convert good detection percentages to scores out of 10
        back_score = (self.good_back / self.total_frames) * 10
        knee_score = (self.good_knees / self.total_frames) * 10
        ball_score = (self.good_ball / self.total_frames) * 10
        overall_score = (back_score + knee_score + ball_score) / 3

        feedback_lines = []
        feedback_lines.append(f"Back Angle: {back_score:.1f}/10")
        feedback_lines.append(f"Knee Angle: {knee_score:.1f}/10")
        feedback_lines.append(f"Ball Position: {ball_score:.1f}/10")
        feedback_lines.append(f"Overall Score: {overall_score:.1f}/10")

        suggestions = []
        if back_score < 7:
            suggestions.append("Improve back posture.")
        if knee_score < 7:
            suggestions.append("Focus on knee alignment.")
        if ball_score < 7:
            suggestions.append("Keep the ball lower than the waist.")
        if not suggestions:
            suggestions.append("Great job! Keep up the good work.")

        feedback_text = "\n".join(feedback_lines) + "\nFeedback: " + " ".join(suggestions)
        return (feedback_text, overall_score)
