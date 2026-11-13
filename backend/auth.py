import os
import logging
from functools import wraps
from uuid import UUID

import requests

from flask import request, jsonify, g

from extensions import db
from models.business_member import BusinessMember
from models.platform_admin import PlatformAdmin


logger = logging.getLogger("myduka.auth")


# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

def get_supabase_config():
    return (
        os.getenv("SUPABASE_URL", "").rstrip("/"),
        os.getenv("SUPABASE_ANON_KEY", "")
    )


# ============================================================
# VERIFY SUPABASE ACCESS TOKEN
# ============================================================

def verify_supabase_token(token):

    supabase_url, anon_key = get_supabase_config()

    if not supabase_url or not anon_key:
        logger.error(
            "SUPABASE_URL or SUPABASE_ANON_KEY is missing."
        )
        return None

    try:
        response = requests.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "apikey": anon_key,
                "Authorization": f"Bearer {token}"
            },
            timeout=10
        )

        if response.status_code != 200:
            logger.warning(
                "Supabase token verification failed: HTTP %s",
                response.status_code
            )
            return None

        user = response.json()

        if not user.get("id"):
            return None

        return user

    except requests.RequestException:
        logger.exception(
            "Supabase authentication request failed."
        )
        return None


# ============================================================
# SHARED AUTHENTICATION
# ============================================================

def supabase_auth_required(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        authorization = request.headers.get(
            "Authorization", ""
        )

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
        g.supabase_access_token = token

        return function(*args, **kwargs)

    return decorated


# ============================================================
# PLATFORM SUPER ADMIN AUTHORIZATION
# ============================================================

def platform_admin_required(function):

    @wraps(function)
    @supabase_auth_required
    def decorated(*args, **kwargs):

        try:

            admin = PlatformAdmin.query.filter_by(
                user_id=g.current_user_id,
                is_active=True
            ).first()

            if not admin:
                return jsonify({
                    "status": "error",
                    "message": "You are not authorized as a platform administrator."
                }), 403

            g.platform_admin = admin

            return function(*args, **kwargs)

        except Exception:

            db.session.rollback()

            logger.exception(
                "Platform administrator authorization failed."
            )

            return jsonify({
                "status": "error",
                "message": "Unable to verify platform administrator access."
            }), 500

    return decorated


# ============================================================
# BUSINESS MEMBERSHIP AUTHORIZATION
# ============================================================

def business_member_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        @supabase_auth_required
        def decorated(*args, **kwargs):

            business_id = request.headers.get(
                "X-Business-ID"
            )

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

            if (
                allowed_roles
                and membership.role not in allowed_roles
            ):
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
