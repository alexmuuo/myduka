import os
import logging

from functools import wraps
from uuid import UUID

import requests

from flask import request, jsonify, g
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.business_member import BusinessMember
from models.platform_admin import PlatformAdmin


logger = logging.getLogger("myduka.auth")


# ============================================================
# BUSINESS ROLES
# ============================================================

BUSINESS_ROLES = (
    "owner",
    "admin",
    "manager",
    "cashier",
)


# ============================================================
# BUSINESS PERMISSIONS
# ============================================================

BUSINESS_PERMISSIONS = {

    "business.view",
    "business.update",

    "branches.view",
    "branches.create",
    "branches.update",
    "branches.delete",

    "staff.view",
    "staff.invite",
    "staff.update",
    "staff.deactivate",

    "products.view",
    "products.create",
    "products.update",
    "products.delete",

    "inventory.view",
    "inventory.receive",
    "inventory.adjust",
    "inventory.transfer",

    "sales.view",
    "sales.create",
    "sales.void",

    "customers.view",
    "customers.create",
    "customers.update",
    "customers.delete",

    "orders.view",
    "orders.manage",

    "reports.view",
    "reports.export",

    "payments.view",
    "payments.manage",

    "settings.view",
    "settings.update",

}


# ============================================================
# ROLE PERMISSION MAP
# ============================================================

ROLE_PERMISSIONS = {

    "owner": BUSINESS_PERMISSIONS.copy(),

    "admin": BUSINESS_PERMISSIONS.copy() - {
        "business.update",
        "staff.deactivate",
    },

    "manager": {

        "business.view",

        "branches.view",

        "staff.view",

        "products.view",
        "products.create",
        "products.update",

        "inventory.view",
        "inventory.receive",
        "inventory.adjust",
        "inventory.transfer",

        "sales.view",
        "sales.create",

        "customers.view",
        "customers.create",
        "customers.update",

        "orders.view",
        "orders.manage",

        "reports.view",
        "reports.export",

        "payments.view",

        "settings.view",

    },

    "cashier": {

        "branches.view",

        "products.view",

        "inventory.view",

        "sales.create",

        "customers.view",
        "customers.create",

        "orders.view",

    },

}


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
            "Supabase configuration is missing."
        )

        return None

    auth_url = f"{supabase_url}/auth/v1/user"

    try:

        response = requests.get(
            auth_url,
            headers={
                "apikey": anon_key,
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            },
            timeout=15,
            allow_redirects=False
        )

        if response.status_code != 200:

            logger.warning(
                "Supabase authentication rejected. HTTP %s",
                response.status_code
            )

            return None

        user = response.json()

        if not isinstance(user, dict) or not user.get("id"):

            logger.error(
                "Supabase returned an invalid user response."
            )

            return None

        return user

    except requests.Timeout:

        logger.error(
            "Supabase authentication request timed out."
        )

        return None

    except requests.RequestException:

        logger.exception(
            "Supabase authentication request failed."
        )

        return None

    except ValueError:

        logger.exception(
            "Unable to decode Supabase response."
        )

        return None


# ============================================================
# SHARED SUPABASE AUTHENTICATION
# ============================================================

def supabase_auth_required(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        authorization = request.headers.get(
            "Authorization",
            ""
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

            g.current_user_id = UUID(
                str(user["id"])
            )

        except (ValueError, TypeError, KeyError):

            logger.warning(
                "Supabase returned an invalid user identity."
            )

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

                logger.warning(
                    "Unauthorized Super Admin access attempt: %s",
                    g.current_user_id
                )

                return jsonify({
                    "status": "error",
                    "message": (
                        "You are not authorized "
                        "as a platform administrator."
                    )
                }), 403

            g.platform_admin = admin

            return function(*args, **kwargs)

        except SQLAlchemyError:

            db.session.rollback()

            logger.exception(
                "Platform administrator authorization database error."
            )

            return jsonify({
                "status": "error",
                "message": (
                    "Unable to verify platform administrator access."
                )
            }), 500

        except Exception:

            db.session.rollback()

            logger.exception(
                "Platform administrator authorization failed."
            )

            return jsonify({
                "status": "error",
                "message": (
                    "Unable to verify platform administrator access."
                )
            }), 500

    return decorated


# ============================================================
# BUSINESS MEMBERSHIP AUTHORIZATION
# ============================================================

def _build_business_member_decorator(
    function,
    allowed_roles
):

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

            business_uuid = UUID(str(business_id))

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Invalid business ID."
            }), 400

        try:

            membership = BusinessMember.query.filter_by(
                business_id=business_uuid,
                user_id=g.current_user_id,
                is_active=True
            ).first()

            if not membership:

                return jsonify({
                    "status": "error",
                    "message": (
                        "You do not have access to this business."
                    )
                }), 403

            role = membership.role

            if role not in BUSINESS_ROLES:

                logger.warning(
                    "Invalid business role. User=%s Business=%s",
                    g.current_user_id,
                    business_uuid
                )

                return jsonify({
                    "status": "error",
                    "message": "Your business role is invalid."
                }), 403

            if allowed_roles and role not in allowed_roles:

                return jsonify({
                    "status": "error",
                    "message": (
                        "You do not have permission "
                        "to perform this action."
                    )
                }), 403

            g.business_id = business_uuid
            g.business_membership = membership
            g.business_role = role

            g.business_permissions = ROLE_PERMISSIONS.get(
                role,
                set()
            )

            return function(*args, **kwargs)

        except SQLAlchemyError:

            db.session.rollback()

            logger.exception(
                "Business membership database lookup failed. "
                "User=%s Business=%s",
                g.current_user_id,
                business_uuid
            )

            return jsonify({
                "status": "error",
                "message": (
                    "Unable to verify business membership."
                )
            }), 500

        except Exception:

            db.session.rollback()

            logger.exception(
                "Business membership authorization failed."
            )

            return jsonify({
                "status": "error",
                "message": (
                    "Unable to verify business access."
                )
            }), 500

    return decorated


# ============================================================
# BUSINESS MEMBER DECORATOR
# ============================================================

def business_member_required(*allowed_roles):

    """
    Supports:

        @business_member_required

        @business_member_required()

        @business_member_required("owner", "admin")

    """

    if (
        len(allowed_roles) == 1
        and callable(allowed_roles[0])
    ):

        function = allowed_roles[0]

        return _build_business_member_decorator(
            function,
            ()
        )

    def decorator(function):

        return _build_business_member_decorator(
            function,
            allowed_roles
        )

    return decorator


# ============================================================
# BUSINESS PERMISSION AUTHORIZATION
# ============================================================

def business_permission_required(*permissions):

    """
    Require an authenticated business member with
    the specified business permissions.

    Example:

        @business_permission_required("products.create")

        @business_permission_required(
            "inventory.view",
            "inventory.receive"
        )

    All supplied permissions must be granted.
    """

    invalid_permissions = (
        set(permissions) - BUSINESS_PERMISSIONS
    )

    if invalid_permissions:

        raise ValueError(
            "Unknown business permissions: "
            + ", ".join(sorted(invalid_permissions))
        )

    def decorator(function):

        @wraps(function)
        @business_member_required
        def decorated(*args, **kwargs):

            user_permissions = getattr(
                g,
                "business_permissions",
                set()
            )

            missing_permissions = (
                set(permissions) - user_permissions
            )

            if missing_permissions:

                return jsonify({
                    "status": "error",
                    "message": (
                        "You do not have permission "
                        "to perform this action."
                    ),
                    "required_permissions": list(
                        permissions
                    )
                }), 403

            return function(*args, **kwargs)

        return decorated

    return decorator


# ============================================================
# CHECK CURRENT BUSINESS PERMISSION
# ============================================================

def has_business_permission(permission):

    if not hasattr(g, "business_permissions"):

        return False

    return permission in g.business_permissions
