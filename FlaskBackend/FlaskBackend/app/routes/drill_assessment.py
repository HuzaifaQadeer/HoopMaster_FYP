from flask import Blueprint, jsonify, request
from app.services.drill_assessment_service import DrillAssessmentService

bp = Blueprint('drill_assessment', __name__, url_prefix='/drill')

@bp.route('/assess', methods=['POST'])
def assess_drill():
    data = request.json
    drill_type = data.get('drill_type')
    video_data = data.get('video_data')
    assessment = DrillAssessmentService.assess_drill(drill_type, video_data)
    return jsonify({'assessment': assessment})
