import os
import time
import shutil

def analyze_video(input_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_filename = f"{base_name}_tween_dribble_{int(time.time())}.mp4"
    output_path = os.path.join(output_folder, output_filename)
    
    shutil.copy(input_path, output_path)
    analysis_text = "Tween dribble analysis: Dummy analysis result."
    return output_path, analysis_text
