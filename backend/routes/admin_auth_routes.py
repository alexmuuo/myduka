"""Business registration and staff login."""

import logging
import re

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from admin_auth import (
    _authenticate_staff,
    _attach,
    create_staff_token,
)
from audit import client_ip, record_audit, recent_count
from extensions import db
from models.branch import Branch
from models.business import BUSINESS_TYPES, Business, SubscriptionPlan
from models.user import User
from permissions import effective_permissions
from plans import ensure_default_plans, trial_end
from tenancy import unscoped


admin_auth_bp = Blueprint("admin_auth_bp", __name__)

logger = logging.getLogger(__name__)

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

RESERVED_SLUGS = {
    "admin", "api", "app", "shop", "shops", "login", "register",
    "cashier", "superadmin", "support", "www", "myduka", "static",
    "assets", "help", "billing", "settings",
}

MAX_FAILED_LOGINS = 5
LOGIN_WINDOW_MINUTES = 15
MAX_REGISTRATIONS_PER_IP = 10


def _error(message, status):
    return jsonify({"status": "error", "message": message}), status


def slugify(name):
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

    return slug[:50].strip("-")


def unique_slug(name):
    base = slugify(name) or "shop"

    if base in RESERVED_SLUGS:
        base = f"{base}-shop"

    candidate = base
    counter = 2

    while Business.query.filter_by(slug=candidate).first():
        candidate = f"{base}-{counter}"
        counter += 1

    return candidate


# ============================================================
# REGISTER A BUSINESS
# POST /api/auth/register-business
# ============================================================

@admin_auth_bp.route("/api/auth/register-business", methods=["POST"])
def register_business():
    data = request.get_json(silent=True) or {}

    def text(key, limit):
        value = data.get(key, "")

        return value.strip()[:limit] if isinstance(value, str) else ""

    business_name = text("business_name", 150)
    owner_name = text("owner_name", 150)
    email = text("email", 150).lower()
    phone = text("phone", 30)
    business_type = text("business_type", 40) or "general_retail"
    password = data.get("password", "")

    if not business_name or not owner_name:
        return _error("Business name and your name are required.", 400)

    if not EMAIL_PATTERN.match(email):
        return _error("Enter a valid email address.", 400)

    if (
        not isinstance(password, str)
        or len(password) < 8
        or len(password) > 128
    ):
        return _error("Password must be 8 to 128 characters.", 400)

    if business_type not in BUSINESS_TYPES:
        return _error("Choose a valid business type.", 400)

    ip = client_ip()

    if ip and recent_count(
        "business_registered", ip=ip, minutes=60
    ) >= MAX_REGISTRATIONS_PER_IP:
        return _error("Too many sign-ups. Try again later.", 429)

    try:
        with unscoped():
            if User.query.filter_by(email=email).first():
                return _error(
                    "An account with this email already exists.", 409
                )

            ensure_default_plans()

            plan = SubscriptionPlan.query.filter_by(code="trial").one()

            business = Business(
                name=business_name,
                slug=unique_slug(business_name),
                business_type=business_type,
                phone=phone or None,
                email=email,
                status="active",
                plan_id=plan.id,
                subscription_status="trialing",
                trial_ends_at=trial_end(),
                settings={},
            )
            db.session.add(business)
            db.session.flush()

            owner = User(
                business_id=business.id,
                email=email,
                full_name=owner_name,
                phone=phone or None,
                role="owner",
            )
            owner.set_password(password)
            db.session.add(owner)

            # Every business starts with one branch so the POS and
            # inventory work immediately.
            db.session.add(Branch(
                business_id=business.id,
                name="Main Branch",
                code="MAIN",
            ))
            db.session.flush()

            record_audit(
                "business_registered",
                entity_type="business",
                entity_id=business.id,
                business_id=business.id,
                user_id=owner.id,
                actor=email,
            )

            db.session.commit()

        token = create_staff_token(owner)

        return jsonify({
            "status": "success",
            "message": "Your business is ready.",
            "token": token,
            "user": owner.to_dict(),
            "business": business.to_dict(),
        }), 201

    except IntegrityError:
        db.session.rollback()

        return _error(
            "That email or shop name was just taken. Try again.", 409
        )

    except RuntimeError:
        db.session.rollback()
        logger.exception("Authentication is not configured.")

        return _error("Authentication is not configured.", 500)

    except Exception:
        db.session.rollback()
        logger.exception("Business registration failed.")

        return _error("Unable to register right now.", 500)


# ============================================================
# STAFF LOGIN (business owners, managers, platform admin)
# POST /api/auth/login   (also /api/admin/login for old clients)
# ============================================================

@admin_auth_bp.route("/api/auth/login", methods=["POST"])
@admin_auth_bp.route("/api/admin/login", methods=["POST"])
def staff_login():
    data = request.get_json(silent=True) or {}

    raw_email = data.get("email", data.get("username", ""))
    password = data.get("password", "")

    if not isinstance(raw_email, str) or not isinstance(password, str):
        return _error("Invalid login details.", 400)

    email = raw_email.strip().lower()

    if not email or not password:
        return _error("Email and password are required.", 400)

    ip = client_ip()

    # Throttle repeated failures per account and per address, using the
    # database because serverless instances share no memory.
    if recent_count(
        "login_failed",
        actor=email,
        ip=ip,
        minutes=LOGIN_WINDOW_MINUTES,
    ) >= MAX_FAILED_LOGINS:
        return _error("Too many attempts. Try again in a few minutes.", 429)

    try:
        with unscoped():
            user = User.query.filter_by(email=email).first()

            valid = (
                user is not None
                and user.is_active
                and user.check_password(password)
            )

            if not valid:
                record_audit(
                    "login_failed",
                    actor=email,
                    business_id=user.business_id if user else None,
                    commit=True,
                )

                return _error("Invalid email or password.", 401)

            business = (
                db.session.get(Business, user.business_id)
                if user.business_id
                else None
            )

            if business is not None and business.status != "active":
                return _error(
                    "This business is not active. Contact support.", 403
                )

            user.last_login_at = func.now()

            record_audit(
                "login",
                actor=email,
                user_id=user.id,
                business_id=user.business_id,
            )

            db.session.commit()
            db.session.refresh(user)

        token = create_staff_token(user)

        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "token": token,
            "user": user.to_dict(),
            "business": business.to_dict() if business else None,
            "permissions": sorted(effective_permissions(user)),
            # Kept for older screens that read response.admin.
            "admin": {"username": user.email, "role": user.role},
        })

    except RuntimeError:
        db.session.rollback()
        logger.exception("Authentication is not configured.")

        return _error("Authentication is not configured.", 500)

    except Exception:
        db.session.rollback()
        logger.exception("Staff login failed.")

        return _error("Unable to process login right now.", 500)


# ============================================================
# CURRENT STAFF USER
# GET /api/auth/me
# ============================================================

@admin_auth_bp.route("/api/auth/me", methods=["GET"])
def staff_me():
    user, business, error = _authenticate_staff()

    if error:
        return error

    _attach(user, business)

    return jsonify({
        "status": "success",
        "user": user.to_dict(),
        "business": business.to_dict() if business else None,
        "permissions": sorted(effective_permissions(user)),
    })
