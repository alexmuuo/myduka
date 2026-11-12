import os
import logging
from functools import wraps
from uuid import UUID

import requests

from flask import request, jsonify, g

from models.business_member import BusinessMember


logger = logging.getLogger("myduka.auth")


# ==================================================
# SUPABASE CONFIGURATION
# ==================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


def verify_supabase_token(token):
    """
    Verify a Supabase access token using Supabase Auth.

    Returns the authenticated user or None.
    """

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        logger.error("Supabase authentication environment variables missing.")
        return None

    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )

        if response.status_code != 200:
            return None

        user = response.json()

        if not user.get("id"):
            return None

        return user

    except requests.RequestException:
        logger.exception("Supabase token verification failed.")
        return None


# ==================================================
# AUTHENTICATION DECORATOR
# ==================================================

def supabase_auth_required(function):

    @wraps(function)
    def decorated(_args, __kwargs):

        authorization = request.headers.get("Authorization", "")

        if not authorization.startswith("Bearer "):
            return jsonify({
                "status": "error",
                "message": "Authentication required."
            }), 401

        token = authorization.split(" ", 1)[1].strip()

        if not token:
            return jsonify({
                "status": "error",
                "message": "Invalid authentication token."
            }), 401

        user = verify_supabase_token(token)

        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid or expired session."
            }), 401

        try:
            g.current_user_id = UUID(user["id"])
        except (ValueError, TypeError, KeyError):
            return jsonify({
                "status": "error",
                "message": "Invalid user identity."
            }), 401

        g.current_user = user

        return function(*args, **kwargs)

    return decorated


# ==================================================
# BUSINESS MEMBERSHIP DECORATOR
# ==================================================

def business_member_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        @supabase_auth_required
        def decorated(*args, **kwargs):

            business_id = request.headers.get("X-Business-ID")

            if not business_id:
                return jsonify({
                    "status": "error",
                    "message": "Business ID is required."
                }), 400

            try:
                business_uuid = UUID(business_id)
            except (ValueError, TypeError):
                return jsonify({
                    "status": "error",
                    "message": "Invalid business ID."
                }), 400

            membership = BusinessMember.query.filter_by(
                business_id=business_uuid,
                user_id=g.current_user_id,
                is_active=True
            ).first()

            if not membership:
                return jsonify({
                    "status": "error",
                    "message": "You do not have access to this business."
                }), 403

            if allowed_roles and membership.role not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": "You do not have permission to perform this action."
                }), 403

            g.business_id = business_uuid
            g.business_membership = membership
            g.business_role = membership.role

            return function(*args, **kwargs)

        return decorated

    return decorator
