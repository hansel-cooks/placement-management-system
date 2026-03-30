

# ============================================================
# config.py — Reads all credentials from .env file
# You never need to touch this file directly
# ============================================================

import os
import secrets
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

# --- MySQL ---
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = int(os.getenv("DB_PORT", 3306))
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "placement_db")

# --- Flask ---
SECRET_KEY        = os.getenv("SECRET_KEY", "fallback_secret")

# Comma-separated, e.g. "https://portal.example.edu,https://api.example.edu"
CORS_ORIGINS      = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

# Session configuration (filesystem for dev; set SESSION_TYPE=redis + REDIS_URL for prod)
SESSION_TYPE      = os.getenv("SESSION_TYPE", "filesystem")
SESSION_PERMANENT = os.getenv("SESSION_PERMANENT", "false").lower() == "true"
REDIS_URL         = os.getenv("REDIS_URL")

# Cookie hardening (set to true behind HTTPS)
SESSION_COOKIE_SECURE   = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")

# CSRF protection (double-submit: token stored in session + header)
CSRF_ENABLED = os.getenv("CSRF_ENABLED", "true").lower() == "true"
CSRF_HEADER  = os.getenv("CSRF_HEADER", "X-CSRF-Token")
CSRF_SESSION_KEY = os.getenv("CSRF_SESSION_KEY", "csrf_token")

def generate_csrf_token():
    return secrets.token_urlsafe(32)