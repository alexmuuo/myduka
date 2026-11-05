import os
import logging

from flask import Flask, jsonify
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
from flask_migrate import Migrate

from extensions import db


# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


# --------------------------------------------------
# INITIALIZE FLASK APPLICATION
# --------------------------------------------------

app = Flask(__name__)


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Check the backend .env file or server environment variables."
    )

# Use the psycopg (v3) driver for every PostgreSQL URL form.
for _prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefix):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_prefix):]
        break

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL

# Serverless-friendly connection settings. prepare_threshold=None turns off
# server-side prepared statements, which Supabase's pooled (pgbouncer)
# connections do not support.
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 280,
    "connect_args": {"prepare_threshold": None},
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


# --------------------------------------------------
# EMAIL CONFIGURATION — GMAIL SMTP
# --------------------------------------------------

app.config["MAIL_SERVER"] = os.getenv(
    "MAIL_SERVER",
    "smtp.gmail.com"
)

app.config["MAIL_PORT"] = int(
    os.getenv("MAIL_PORT", "587")
)

app.config["MAIL_USE_TLS"] = (
    os.getenv("MAIL_USE_TLS", "true").lower() == "true"
)

app.config["MAIL_USE_SSL"] = False

app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

app.config["MAIL_DEFAULT_SENDER"] = os.getenv(
    "MAIL_DEFAULT_SENDER"
)

mail = Mail(app)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

# The frontend calls the API on the same origin (/api), so CORS is only
# needed for local development or extra origins set in CORS_ORIGINS.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")
    if origin.strip()
]

CORS(
    app,
    resources={
        r"/*": {
            "origins": allowed_origins,
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "X-Shop-Slug",
            ],
            "supports_credentials": False,
        }
    },
)

# --------------------------------------------------
# INITIALIZE DATABASE AND MIGRATIONS
# --------------------------------------------------

db.init_app(app)

# Enables Flask-Migrate commands (flask db ...).
# This does not modify the database until a migration is applied.
migrate = Migrate(app, db)


# --------------------------------------------------
# LOGGING CONFIGURATION
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# IMPORT MODELS
# --------------------------------------------------

import models  # noqa: F401  (registers every model with SQLAlchemy)
import tenancy  # noqa: F401  (installs tenant isolation hooks)


# --------------------------------------------------
# IMPORT ROUTES
# --------------------------------------------------

from routes.product_routes import product_bp
from routes.order_routes import order_bp
from routes.admin_routes import admin_bp
from routes.message_routes import message_bp
from routes.customer_routes import customer_bp
from routes.notification import notification_bp
from routes.admin_auth_routes import admin_auth_bp
from routes.payment_routes import payment_bp
from routes.cashier_routes import cashier_bp
from routes.cashier_sales import cashier_sales_bp
from routes.admin_pos_sales import admin_pos_sales_bp

# --------------------------------------------------
# REGISTER ROUTES
# --------------------------------------------------

app.register_blueprint(product_bp)
app.register_blueprint(order_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(message_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(admin_auth_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(cashier_bp)
app.register_blueprint(cashier_sales_bp)
app.register_blueprint(admin_pos_sales_bp)

# --------------------------------------------------
# TENANT ERRORS AND COMMAND-LINE TOOLS
# --------------------------------------------------

from tenancy import TenantError


@app.errorhandler(TenantError)
def handle_tenant_error(error):
    db.session.rollback()

    logger.error("Tenant isolation error: %s", error)

    return jsonify({
        "status": "error",
        "message": "Request refused.",
    }), 403


import cli  # noqa: E402

cli.register(app)


# --------------------------------------------------
# PUBLIC HEALTH CHECK
# --------------------------------------------------

@app.route("/")
def home():
    return jsonify({
        "message": "MyDuka API is running."
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "MyDuka backend is healthy."
    })


# --------------------------------------------------
# DATABASE DIAGNOSTIC
# --------------------------------------------------
# Requires the existing admin authentication token.

from admin_auth import admin_required


@app.route("/api/database-test")
@admin_required
def database_test():
    try:
        db.session.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "ok",
            "message": "Database connection is working."
        })

    except Exception:
        db.session.rollback()

        logger.exception("Database diagnostic failed.")

        return jsonify({
            "status": "error",
            "message": "Database connection test failed."
        }), 500


# --------------------------------------------------
# APPLICATION STARTUP
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
    )
