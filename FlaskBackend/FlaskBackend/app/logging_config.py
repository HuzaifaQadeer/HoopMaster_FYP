import logging
import os
from logging.handlers import RotatingFileHandler
import sys

def configure_logging():
    """Configure detailed logging for the Flask application"""
    
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Console handler (for stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    root_logger.addHandler(console_handler)
    
    # File handlers
    # Main application log
    app_log_path = os.path.join(logs_dir, 'flask_app.log')
    app_file_handler = RotatingFileHandler(
        app_log_path, maxBytes=10*1024*1024, backupCount=5
    )
    app_file_handler.setLevel(logging.INFO)
    app_file_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(app_file_handler)
    
    # Shot analyzer log
    shot_analyzer_log_path = os.path.join(logs_dir, 'shot_analyzer.log')
    shot_analyzer_file_handler = RotatingFileHandler(
        shot_analyzer_log_path, maxBytes=10*1024*1024, backupCount=5
    )
    shot_analyzer_file_handler.setLevel(logging.DEBUG)
    shot_analyzer_file_handler.setFormatter(detailed_formatter)
    
    # Configure specific loggers
    shot_analyzer_logger = logging.getLogger('app.services.shot_analyzer')
    shot_analyzer_logger.setLevel(logging.DEBUG)
    shot_analyzer_logger.addHandler(shot_analyzer_file_handler)
    
    # Practice analysis log
    practice_log_path = os.path.join(logs_dir, 'practice_analysis.log')
    practice_file_handler = RotatingFileHandler(
        practice_log_path, maxBytes=10*1024*1024, backupCount=5
    )
    practice_file_handler.setLevel(logging.DEBUG)
    practice_file_handler.setFormatter(detailed_formatter)
    
    # Configure practice analysis logger
    practice_logger = logging.getLogger('app.routes.practice_analysis')
    practice_logger.setLevel(logging.DEBUG)
    practice_logger.addHandler(practice_file_handler)
    
    # Error log for all errors
    error_log_path = os.path.join(logs_dir, 'errors.log')
    error_file_handler = RotatingFileHandler(
        error_log_path, maxBytes=10*1024*1024, backupCount=5
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_file_handler)
    
    logging.info("Logging configured successfully")
    return root_logger 