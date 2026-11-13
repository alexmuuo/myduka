import os
import logging

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv


from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from routes.business_routes import business_bp
from routes.superadmin_routes import superadmin_bp



# ==================================================
# ENVIRONMENT CONFIGURATION
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


# ==================================================
# LOGGING
# ==================================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("myduka")


# ==================================================
# DATABASE URL
# ==================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. "
        "Configure it in backend/.env or Vercel environment variables."
    )

# Normalize PostgreSQL URLs for psycopg 3.
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


# ==================================================
# CREATE FLASK APPLICATION
# ==================================================

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


# ==================================================
# CORS CONFIGURATION
# ==================================================

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if origin.strip()
]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "X-Business-ID"
            ],
            "supports_credentials": False
        }
    }
)


# ==================================================
# DATABASE INITIALIZATION
# ==================================================

db.init_app(app)
app.register_blueprint(business_bp)
app.register_blueprint(superadmin_bp)
# ==================================================
# APPLICATION INFORMATION
# ==================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "application": "MyDuka",
        "message": "MyDuka API is running.",
        "status": "ok"
    }), 200


# ==================================================
# HEALTH CHECK
# ==================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "application": "MyDuka",
        "status": "healthy",
        "message": "MyDuka backend is operational."
    }), 200


# ==================================================
# DATABASE CONNECTION TEST
# ==================================================

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


# ==================================================
# ERROR HANDLERS
# ==================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "status": "error",
        "message": "The requested endpoint does not exist."
    }), 404


@app.errorhandler(500)
def internal_server_error(error):

    logger.exception("Unexpected internal server error.")

    return jsonify({
        "status": "error",
        "message": "An unexpected server error occurred."
    }), 500


# ==================================================
# LOCAL DEVELOPMENT
# ==================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv(
            "FLASK_DEBUG",
            "false"
        ).lower() == "true"
    )
