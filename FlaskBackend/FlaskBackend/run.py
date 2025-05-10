from app import create_app
from flask import request

app = create_app()

@app.before_request
def log_request():
    print(f"Incoming {request.method} request to: {request.path}")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8082)
