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
        self.last_ball_y = None
        self.last_ball_time = None
        self.ball_timeout = 1.0  # fallback time (in seconds)

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
        back_pct = 100.0 * self.good_back / self.total_frames
        knee_pct = 100.0 * self.good_knees / self.total_frames
        ball_pct = 100.0 * self.good_ball / self.total_frames

        final_score = (back_pct + knee_pct + ball_pct) / 3.0

        lines = []
        lines.append(f"Back Angle Good ~{back_pct:.1f}% => " + ("Good" if back_pct >= 70 else "Needs improvement"))
        lines.append(f"Knee Angle Good ~{knee_pct:.1f}% => " + ("Good" if knee_pct >= 70 else "Needs improvement"))
        lines.append(f"Ball Below Waist ~{ball_pct:.1f}% => " + ("Good" if ball_pct >= 70 else "Needs improvement"))

        feedback = "\n".join(lines)
        return (feedback, final_score)
