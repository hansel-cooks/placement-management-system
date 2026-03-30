# ============================================================
# app.py — Flask Application Entry Point
# ============================================================

from flask import Flask, jsonify, request, session
from flask_session import Session
from flask_cors import CORS

import config
from routes.auth    import auth_bp
from routes.student import student_bp
from routes.company import company_bp
from routes.admin   import admin_bp

# ----------------------------------------------------------
# App setup
# ----------------------------------------------------------
app = Flask(__name__)

app.config["SECRET_KEY"]       = config.SECRET_KEY
app.config["SESSION_TYPE"]     = config.SESSION_TYPE
app.config["SESSION_PERMANENT"] = config.SESSION_PERMANENT
app.config["SESSION_COOKIE_SECURE"] = config.SESSION_COOKIE_SECURE
app.config["SESSION_COOKIE_SAMESITE"] = config.SESSION_COOKIE_SAMESITE
app.config["SESSION_COOKIE_HTTPONLY"] = True

if config.SESSION_TYPE == "redis" and config.REDIS_URL:
    app.config["SESSION_REDIS"] = config.REDIS_URL

# Initialise server-side sessions
Session(app)

# Allow React frontend to talk to this backend
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS(app, supports_credentials=True, origins=(config.CORS_ORIGINS or default_origins))

# ----------------------------------------------------------
# CSRF protection for cookie-session auth
# ----------------------------------------------------------
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

@app.route("/api/auth/csrf", methods=["GET"])
def csrf_token():
    if not config.CSRF_ENABLED:
        return jsonify({"csrf_token": None}), 200
    token = session.get(config.CSRF_SESSION_KEY)
    if not token:
        token = config.generate_csrf_token()
        session[config.CSRF_SESSION_KEY] = token
    return jsonify({"csrf_token": token}), 200


@app.before_request
def enforce_csrf():
    if not config.CSRF_ENABLED:
        return None
    if request.method in SAFE_METHODS:
        return None
    # Only enforce CSRF if the request has a session (logged in) OR tries to use one.
    expected = session.get(config.CSRF_SESSION_KEY)
    provided = request.headers.get(config.CSRF_HEADER)
    if not expected or not provided or provided != expected:
        return jsonify({"error": "CSRF token missing or invalid"}), 403
    return None

# ----------------------------------------------------------
# Register blueprints (each file = one section of the API)
# ----------------------------------------------------------
app.register_blueprint(auth_bp,    url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(company_bp, url_prefix="/api/company")
app.register_blueprint(admin_bp,   url_prefix="/api/admin")


# ----------------------------------------------------------
# Health check — visit http://localhost:5000/api/health
# to confirm the server is running
# ----------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Placement backend is running"}), 200


# ----------------------------------------------------------
# 404 handler
# ----------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


# ----------------------------------------------------------
# 500 handler
# ----------------------------------------------------------
@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ----------------------------------------------------------
# Run
# ----------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
    