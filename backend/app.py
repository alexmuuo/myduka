import os
import logging

from flask import Flask, jsonify, request, make_response
from dotenv import load_dotenv

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from routes.business_routes import business_bp
from routes.superadmin_routes import superadmin_bp


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("myduka")


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing."
    )

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1
    )

elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )


# ============================================================
# CREATE FLASK APPLICATION
# ============================================================

app = Flask(__name__)

app.config.update(
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,

    SQLALCHEMY_ENGINE_OPTIONS={
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": 5,
        "max_overflow": 2,
        "connect_args": {
            "prepare_threshold": None
        }
    },

    JSON_SORT_KEYS=False
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

ALLOWED_ORIGINS = {
    "https://myduka-zeta.vercel.app",
    "http://localhost:5173"
}

configured_origins = os.getenv("CORS_ORIGINS", "")

for origin in configured_origins.split(","):
    origin = origin.strip().rstrip("/")
    if origin:
        ALLOWED_ORIGINS.add(origin)


ALLOWED_METHODS = (
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
)

ALLOWED_HEADERS = (
    "Authorization, Content-Type, X-Business-ID"
)


# ============================================================
# HANDLE PREFLIGHT BEFORE API ROUTES
# ============================================================

@app.before_request
def handle_preflight():

    if request.method == "OPTIONS" and request.path.startswith("/api/"):

        origin = request.headers.get("Origin", "")

        logger.info(
            "CORS PREFLIGHT: origin=%s path=%s",
            origin,
            request.path
        )

        response = make_response("", 204)

        return response

    return None


# ============================================================
# ADD CORS HEADERS TO RESPONSES
# ============================================================

@app.after_request
def add_cors_headers(response):

    origin = request.headers.get("Origin", "")

    if origin in ALLOWED_ORIGINS:

        response.headers["Access-Control-Allow-Origin"] = origin

        response.headers["Access-Control-Allow-Methods"] = (
            ALLOWED_METHODS
        )

        response.headers["Access-Control-Allow-Headers"] = (
            ALLOWED_HEADERS
        )

        response.headers["Access-Control-Max-Age"] = "600"

        response.headers.add("Vary", "Origin")

    return response


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

db.init_app(app)


# ============================================================
# REGISTER API BLUEPRINTS
# ============================================================

app.register_blueprint(business_bp)
app.register_blueprint(superadmin_bp)


# ============================================================
# APPLICATION INFORMATION
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "application": "MyDuka",
        "message": "MyDuka API is running.",
        "status": "ok"
    }), 200


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "application": "MyDuka",
        "status": "healthy",
        "message": "MyDuka backend is operational."
    }), 200


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

@app.route("/api/database-test", methods=["GET"])
def database_test():

    try:

        db.session.execute(text("SELECT 1"))

        return jsonify({
            "status": "ok",
            "database": "connected",
            "message": "MyDuka database connection is working."
        }), 200

    except SQLAlchemyError:

        db.session.rollback()

        logger.exception(
            "MyDuka database connection test failed."
        )

        return jsonify({
            "status": "error",
            "database": "disconnected",
            "message": "Unable to connect to the database."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "status": "error",
        "message": "The requested endpoint does not exist."
    }), 404


@app.errorhandler(500)
def internal_server_error(error):

    logger.error(
        "Unexpected internal server error: %s",
        error
    )

    return jsonify({
        "status": "error",
        "message": "An unexpected server error occurred."
    }), 500


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv(
            "FLASK_DEBUG",
            "false"
        ).lower() == "true"
    )
