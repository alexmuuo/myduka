import os
from functools import wraps

from flask import request, jsonify, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


TOKEN_SALT = "myduka-admin-auth"
TOKEN_MAX_AGE = 8 * 60 * 60  # 8 hours


def get_token_serializer():
    secret = os.getenv("ADMIN_TOKEN_SECRET")

    if not secret:
        raise RuntimeError(
            "ADMIN_TOKEN_SECRET is not configured."
        )

    return URLSafeTimedSerializer(secret)


def create_admin_token(username):
    serializer = get_token_serializer()

    return serializer.dumps({
        "username": username,
        "role": "admin"
    }, salt=TOKEN_SALT)


def admin_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        authorization = request.headers.get(
            "Authorization", ""
        )

        if not authorization.startswith("Bearer "):
            return jsonify({
                "status": "error",
                "message": "Admin authentication required."
            }), 401

        token = authorization.split(" ", 1)[1].strip()

        if not token:
            return jsonify({
                "status": "error",
                "message": "Missing authentication token."
            }), 401

        try:
            serializer = get_token_serializer()

            admin_data = serializer.loads(
                token,
                salt=TOKEN_SALT,
                max_age=TOKEN_MAX_AGE
            )

            if admin_data.get("role") != "admin":
                return jsonify({
                    "status": "error",
                    "message": "Admin access required."
                }), 403

            g.admin = admin_data

        except SignatureExpired:
            return jsonify({
                "status": "error",
                "message": "Admin session expired. Please log in again."
            }), 401

        except (BadSignature, ValueError):
            return jsonify({
                "status": "error",
                "message": "Invalid authentication token."
            }), 401

        except RuntimeError:
            return jsonify({
                "status": "error",
                "message": "Admin authentication is not configured."
            }), 500

        return view_function(*args, **kwargs)

    return wrapped