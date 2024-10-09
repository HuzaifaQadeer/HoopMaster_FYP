from flask import Blueprint, jsonify, request
from app.services.practice_analysis_service import PracticeAnalysisService

bp = Blueprint('practice_analysis', __name__, url_prefix='/practice')

@bp.route('/analyze', methods=['POST'])
def analyze_practice():
    data = request.json
    video_data = data.get('video_data')
    analysis = PracticeAnalysisService.analyze_practice(video_data)
    return jsonify({'analysis': analysis})
