# ============================================================
# routes/auth.py — Register / Login / Logout / Me
# ============================================================

from flask import Blueprint, request, session, jsonify
import bcrypt
from db import query

auth_bp = Blueprint("auth", __name__)


# ----------------------------------------------------------
# Helper: build a safe user response (no password)
# ----------------------------------------------------------
def safe_user(user):
    return {
        "user_id":   user["user_id"],
        "username":  user["username"],
        "role":      user["role"],
        "entity_id": user["entity_id"],
    }


# ----------------------------------------------------------
# POST /api/auth/register
# Body (student):
#   { "role":"student", "username":"...", "password":"...",
#     "full_name":"...", "email":"...", "department":"...",
#     "graduation_year":2025, "cgpa":8.5, "phone":"..." }
#
# Body (company):
#   { "role":"company", "username":"...", "password":"...",
#     "company_name":"...", "industry":"...", "hr_name":"...",
#     "hr_email":"...", "hr_phone":"...", "website":"..." }
# ----------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    role     = data.get("role")
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not role or not username or not password:
        return jsonify({"error": "role, username and password are required"}), 400

    if role not in ("student", "company"):
        return jsonify({"error": "Only student or company can self-register"}), 400

    # Check username taken
    existing = query("SELECT user_id FROM Users WHERE username = %s",
                     (username,), fetchone=True)
    if existing:
        return jsonify({"error": "Username already taken"}), 409

    # Hash password
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    entity_id = None

    if role == "student":
        required = ["full_name", "email", "department", "graduation_year", "cgpa"]
        for f in required:
            if not data.get(f):
                return jsonify({"error": f"{f} is required for student registration"}), 400

        entity_id = query(
            """INSERT INTO Students
               (full_name, email, phone, department, graduation_year, cgpa)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (data["full_name"], data["email"], data.get("phone"),
             data["department"], data["graduation_year"], data["cgpa"]),
            commit=True
        )

    elif role == "company":
        required = ["company_name", "hr_email"]
        for f in required:
            if not data.get(f):
                return jsonify({"error": f"{f} is required for company registration"}), 400

        entity_id = query(
            """INSERT INTO Companies
               (company_name, industry, website, hr_name, hr_email, hr_phone)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (data["company_name"], data.get("industry"), data.get("website"),
             data.get("hr_name"), data["hr_email"], data.get("hr_phone")),
            commit=True
        )

    # Create user account
    query(
        "INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)",
        (username, pw_hash, role, entity_id),
        commit=True
    )

    return jsonify({"message": "Registration successful. Please log in."}), 201


# ----------------------------------------------------------
# POST /api/auth/login
# Body: { "username": "...", "password": "..." }
# ----------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = query("SELECT * FROM Users WHERE username = %s", (username,), fetchone=True)

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid username or password"}), 401

    # Store in session
    session["user_id"]   = user["user_id"]
    session["role"]      = user["role"]
    session["entity_id"] = user["entity_id"]
    session["username"]  = user["username"]
    # Issue CSRF token for this session (used by mutating requests)
    try:
        import config as app_config
        if app_config.CSRF_ENABLED and not session.get(app_config.CSRF_SESSION_KEY):
            session[app_config.CSRF_SESSION_KEY] = app_config.generate_csrf_token()
    except Exception:
        pass

    return jsonify({
        "message": "Login successful",
        "user": safe_user(user)
    }), 200


# ----------------------------------------------------------
# POST /api/auth/logout
# ----------------------------------------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200


# ----------------------------------------------------------
# GET /api/auth/me  — who is currently logged in?
# ----------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    user = query("SELECT * FROM Users WHERE user_id = %s",
                 (session["user_id"],), fetchone=True)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(safe_user(user)), 200


# ----------------------------------------------------------
# PUT /api/auth/change-password
# Body: { "current_password": "...", "new_password": "..." }
# Any logged-in user (student, company, admin) can use this
# ----------------------------------------------------------
@auth_bp.route("/change-password", methods=["PUT"])
def change_password():
    if "user_id" not in session:
        return jsonify({"error": "Please log in"}), 401

    data             = request.get_json()
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "current_password and new_password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user = query("SELECT * FROM Users WHERE user_id = %s",
                 (session["user_id"],), fetchone=True)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(current_password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Current password is incorrect"}), 400

    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    query(
        "UPDATE Users SET password_hash = %s WHERE user_id = %s",
        (new_hash, session["user_id"]), commit=True
    )
    return jsonify({"message": "Password changed successfully"}), 200