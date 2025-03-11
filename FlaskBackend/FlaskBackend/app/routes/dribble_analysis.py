from flask import Blueprint, request, jsonify, current_app
import os

# Import analyze_video functions from each dribble’s service module
from app.services.basic_dribble.process_services import analyze_video as basic_dribble_analyze
from app.services.behind_the_back.process_services import analyze_video as behind_the_back_analyze
from app.services.between_the_legs.process_services import analyze_video as between_the_legs_analyze
from app.services.crossover_dribble.process_services import analyze_video as crossover_dribble_analyze
from app.services.tween_dribble.process_services import analyze_video as tween_dribble_analyze

dribble_bp = Blueprint('dribble', __name__)

@dribble_bp.route('/basic_dribble', methods=['POST'])
def basic_dribble():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    output_folder = current_app.config.get('OUTPUT_FOLDER')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    input_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(input_path)

    try:
        output_video_path, analysis_text = basic_dribble_analyze(input_path, output_folder)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # If processing stopped due to absence of player or ball, no video is generated.
    if output_video_path is None:
        return jsonify({
            "analysis": analysis_text
        }), 200

    # Otherwise, build the video URL from the processed folder.
    video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
    return jsonify({
        "analysis": analysis_text,
        "video_url": video_url
    }), 200

@dribble_bp.route('/behind_the_back', methods=['POST'])
def behind_the_back():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    output_folder = current_app.config.get('OUTPUT_FOLDER')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    input_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(input_path)

    try:
        output_video_path, analysis_text = behind_the_back_analyze(input_path, output_folder)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if output_video_path is None:
        return jsonify({
            "analysis": analysis_text
        }), 200

    video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
    return jsonify({
        "analysis": analysis_text,
        "video_url": video_url
    }), 200

@dribble_bp.route('/between_the_legs', methods=['POST'])
def between_the_legs():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    output_folder = current_app.config.get('OUTPUT_FOLDER')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    input_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(input_path)

    try:
        output_video_path, analysis_text = between_the_legs_analyze(input_path, output_folder)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if output_video_path is None:
        return jsonify({
            "analysis": analysis_text
        }), 200

    video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
    return jsonify({
        "analysis": analysis_text,
        "video_url": video_url
    }), 200

@dribble_bp.route('/crossover_dribble', methods=['POST'])
def crossover_dribble():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    output_folder = current_app.config.get('OUTPUT_FOLDER')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    input_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(input_path)

    try:
        output_video_path, analysis_text = crossover_dribble_analyze(input_path, output_folder)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if output_video_path is None:
        return jsonify({
            "analysis": analysis_text
        }), 200

    video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
    return jsonify({
        "analysis": analysis_text,
        "video_url": video_url
    }), 200

@dribble_bp.route('/tween_dribble', methods=['POST'])
def tween_dribble():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    output_folder = current_app.config.get('OUTPUT_FOLDER')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    input_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(input_path)

    try:
        output_video_path, analysis_text = tween_dribble_analyze(input_path, output_folder)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if output_video_path is None:
        return jsonify({
            "analysis": analysis_text
        }), 200

    video_url = f"/uploads/processed_videos/{os.path.basename(output_video_path)}"
    return jsonify({
        "analysis": analysis_text,
        "video_url": video_url
    }), 200