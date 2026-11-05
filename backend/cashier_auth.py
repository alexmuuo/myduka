import os
from functools import wraps

from flask import g, jsonify, request
from itsdangerous import (
    BadSignature,
    SignatureExpired,
    URLSafeTimedSerializer,
)

from extensions import db
from models.cashier import Cashier


TOKEN_SALT = "myduka-cashier-auth"
TOKEN_MAX_AGE = 8 * 60 * 60  # 8 hours


def get_token_serializer():
    secret = os.getenv("CASHIER_TOKEN_SECRET")

    if not secret or not secret.strip():
        raise RuntimeError(
            "CASHIER_TOKEN_SECRET is not configured."
        )

    return URLSafeTimedSerializer(
        secret,
        salt=TOKEN_SALT,
    )


def create_cashier_token(cashier):
    serializer = get_token_serializer()

    return serializer.dumps({
        "cashier_id": cashier.id,
        "username": cashier.username,
        "role": "cashier",
    })

def cashier_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        # Allow browser CORS preflight requests through without
        # requiring a cashier token. The actual request remains protected.
        if request.method == "OPTIONS":
            return "", 204

        authorization = request.headers.get("Authorization", "")
        parts = authorization.split()

        if (
            len(parts) != 2
            or parts[0].lower() != "bearer"
            or not parts[1]
        ):
            return jsonify({
                "status": "error",
                "message": "Cashier authentication required.",
            }), 401

        token = parts[1]

        # Validate the token signature, age, and payload.
        try:
            serializer = get_token_serializer()
            cashier_data = serializer.loads(
                token,
                max_age=TOKEN_MAX_AGE,
            )

        except SignatureExpired:
            return jsonify({
                "status": "error",
                "message": (
                    "Cashier session expired. "
                    "Please log in again."
                ),
            }), 401

        except (BadSignature, ValueError, TypeError):
            return jsonify({
                "status": "error",
                "message": "Invalid authentication token.",
            }), 401

        except RuntimeError:
            return jsonify({
                "status": "error",
                "message": (
                    "Cashier authentication is not configured."
                ),
            }), 500

        # Validate the token payload.
        if not isinstance(cashier_data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid cashier session.",
            }), 401

        if cashier_data.get("role") != "cashier":
            return jsonify({
                "status": "error",
                "message": "Cashier access required.",
            }), 403

        cashier_id = cashier_data.get("cashier_id")

        # Reject invalid IDs, including booleans.
        if (
            not isinstance(cashier_id, int)
            or isinstance(cashier_id, bool)
            or cashier_id <= 0
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid cashier session.",
            }), 401

        # Confirm the account still exists and is active.
        try:
            cashier = db.session.get(Cashier, cashier_id)

        except Exception:
            db.session.rollback()
            return jsonify({
                "status": "error",
                "message": "Unable to verify cashier session.",
            }), 503

        if cashier is None or not cashier.is_active:
            return jsonify({
                "status": "error",
                "message": "Cashier account is unavailable.",
            }), 401

        g.cashier = cashier

        return view_function(*args, **kwargs)

    return wrapped

