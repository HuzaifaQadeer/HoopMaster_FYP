import os
from pathlib import Path
from .basic_dribble.feature_extractor import extract_features
from .basic_dribble.evaluator import evaluate_drill

class DrillAssessmentService:
    # Initialize YOLO model path
    MODELS_DIR = Path(__file__).parent.parent / 'static' / 'models'
    
    @staticmethod
    def assess_drill(drill_type, frame):
        if drill_type == 'basic_dribble':
            # Extract features from the frame
            features = extract_features(frame)
            if features is None:
                return {"error": "No features detected"}
            
            # Evaluate the drill
            assessment = evaluate_drill(features)
            return assessment
        else:
            return {"error": "Unsupported drill type"}
