import os
from functools import wraps

from flask import request, jsonify, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from models.customer import Customer


# ============================================================
# CUSTOMER AUTHENTICATION SETTINGS
# ============================================================

CUSTOMER_TOKEN_MAX_AGE = 60 * 60 * 24  # 24 hours


# ============================================================
# TOKEN SERIALIZER
# ============================================================

def get_customer_token_serializer():
    secret = os.environ.get("CUSTOMER_TOKEN_SECRET")

    if not secret:
        raise RuntimeError(
            "CUSTOMER_TOKEN_SECRET is not configured"
        )

    return URLSafeTimedSerializer(
        secret,
        salt="myduka-customer-auth"
    )


# ============================================================
# CREATE CUSTOMER TOKEN
# ============================================================

def create_customer_token(customer):
    serializer = get_customer_token_serializer()

    return serializer.dumps({
        "customer_id": customer.id,
        "role": "customer"
    })


# ============================================================
# REQUIRE CUSTOMER LOGIN
# ============================================================

def customer_required(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):

        authorization = request.headers.get(
            "Authorization", ""
        )

        if not authorization.startswith("Bearer "):
            return jsonify({
                "status": "error",
                "message": "Customer authentication required"
            }), 401

        token = authorization.split(" ", 1)[1].strip()

        if not token:
            return jsonify({
                "status": "error",
                "message": "Customer authentication required"
            }), 401

        try:
            serializer = get_customer_token_serializer()

            payload = serializer.loads(
                token,
                max_age=CUSTOMER_TOKEN_MAX_AGE
            )

            if payload.get("role") != "customer":
                return jsonify({
                    "status": "error",
                    "message": "Invalid customer token"
                }), 403

            customer_id = payload.get("customer_id")

            if not customer_id:
                return jsonify({
                    "status": "error",
                    "message": "Invalid customer token"
                }), 401

            customer = Customer.query.get(customer_id)

            if not customer:
                return jsonify({
                    "status": "error",
                    "message": "Customer account not found"
                }), 401

            # Make the authenticated customer available
            # to the protected route.
            g.customer = customer

        except SignatureExpired:
            return jsonify({
                "status": "error",
                "message": "Customer session has expired. Please log in again."
            }), 401

        except BadSignature:
            return jsonify({
                "status": "error",
                "message": "Invalid customer token"
            }), 401

        except RuntimeError:
            return jsonify({
                "status": "error",
                "message": "Customer authentication is not configured"
            }), 500

        return view_function(*args, **kwargs)

    return decorated_function