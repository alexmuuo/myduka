import os
from functools import wraps

from flask import g, jsonify, request
from itsdangerous import (
    BadSignature,
    SignatureExpired,
    URLSafeTimedSerializer,
)

from admin_auth import password_version
from extensions import db
from models.business import Business
from models.cashier import Cashier
from tenancy import business_is_open, set_tenant, unscoped


TOKEN_SALT = "myduka-cashier-auth"
TOKEN_MAX_AGE = 8 * 60 * 60  # 8 hours


def get_token_serializer():
    secret = os.getenv("CASHIER_TOKEN_SECRET")

    if not secret or not secret.strip():
        raise RuntimeError("CASHIER_TOKEN_SECRET is not configured.")

    return URLSafeTimedSerializer(secret, salt=TOKEN_SALT)


def create_cashier_token(cashier):
    return get_token_serializer().dumps({
        "k": "cashier",
        "cashier_id": cashier.id,
        "pv": password_version(cashier.password_hash),
    })


def _error(message, status):
    return jsonify({"status": "error", "message": message}), status


def cashier_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        # CORS preflight carries no token; the real request is protected.
        if request.method == "OPTIONS":
            return "", 204

        parts = request.headers.get("Authorization", "").split()

        if (
            len(parts) != 2
            or parts[0].lower() != "bearer"
            or not parts[1]
        ):
            return _error("Cashier authentication required.", 401)

        try:
            data = get_token_serializer().loads(
                parts[1], max_age=TOKEN_MAX_AGE
            )

        except SignatureExpired:
            return _error(
                "Cashier session expired. Please log in again.", 401
            )

        except (BadSignature, ValueError, TypeError):
            return _error("Invalid authentication token.", 401)

        except RuntimeError:
            return _error("Cashier authentication is not configured.", 500)

        if not isinstance(data, dict) or data.get("k") != "cashier":
            return _error("Invalid cashier session.", 401)

        cashier_id = data.get("cashier_id")

        if (
            not isinstance(cashier_id, int)
            or isinstance(cashier_id, bool)
            or cashier_id <= 0
        ):
            return _error("Invalid cashier session.", 401)

        # The cashier row decides the tenant, so this one lookup is
        # deliberately unscoped.
        try:
            with unscoped():
                cashier = db.session.get(Cashier, cashier_id)

            business = (
                db.session.get(Business, cashier.business_id)
                if cashier is not None
                else None
            )

        except Exception:
            db.session.rollback()
            return _error("Unable to verify cashier session.", 503)

        if (
            cashier is None
            or not cashier.is_active
            or data.get("pv") != password_version(cashier.password_hash)
        ):
            return _error("Cashier account is unavailable.", 401)

        if not business_is_open(business):
            return _error(
                "This business is not active. Contact support.", 403
            )

        g.cashier = cashier
        g.business = business
        set_tenant(cashier.business_id)

        return view_function(*args, **kwargs)

    return wrapped
