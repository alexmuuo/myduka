"""Authentication for platform and business staff (the users table).

admin_required      business owners and managers; sets the tenant.
super_admin_required  platform owner; no business, sees every tenant
                      only through explicit unscoped() queries.
permission_required   fine-grained check for any staff role.
"""

import hashlib
import os
from functools import wraps

from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from extensions import db
from models.business import Business
from models.user import User
from permissions import has_permission
from tenancy import business_is_open, set_tenant


TOKEN_SALT = "myduka-staff-auth"
TOKEN_MAX_AGE = 8 * 60 * 60  # 8 hours

BUSINESS_ADMIN_ROLES = ("owner", "manager")


def get_token_serializer():
    secret = os.getenv("ADMIN_TOKEN_SECRET")

    if not secret or not secret.strip():
        raise RuntimeError("ADMIN_TOKEN_SECRET is not configured.")

    return URLSafeTimedSerializer(secret, salt=TOKEN_SALT)


def password_version(password_hash):
    """Changes whenever the password changes, which revokes old tokens."""
    return hashlib.sha256(
        (password_hash or "").encode("utf-8")
    ).hexdigest()[:16]


def create_staff_token(user):
    return get_token_serializer().dumps({
        "k": "user",
        "uid": user.id,
        "pv": password_version(user.password_hash),
    })


def _error(message, status):
    return jsonify({"status": "error", "message": message}), status


def _authenticate_staff():
    """Return (user, business, error_response)."""
    header = request.headers.get("Authorization", "")
    parts = header.split()

    if (
        len(parts) != 2
        or parts[0].lower() != "bearer"
        or not parts[1]
    ):
        return None, None, _error("Authentication required.", 401)

    try:
        payload = get_token_serializer().loads(
            parts[1], max_age=TOKEN_MAX_AGE
        )

    except SignatureExpired:
        return None, None, _error(
            "Session expired. Please log in again.", 401
        )

    except (BadSignature, ValueError, TypeError):
        return None, None, _error("Invalid authentication token.", 401)

    except RuntimeError:
        return None, None, _error(
            "Authentication is not configured.", 500
        )

    user_id = payload.get("uid") if isinstance(payload, dict) else None

    if (
        payload.get("k") != "user"
        or not isinstance(user_id, int)
        or isinstance(user_id, bool)
    ):
        return None, None, _error("Invalid authentication token.", 401)

    try:
        user = db.session.get(User, user_id)

    except Exception:
        db.session.rollback()
        return None, None, _error("Unable to verify session.", 503)

    if (
        user is None
        or not user.is_active
        or payload.get("pv") != password_version(user.password_hash)
    ):
        return None, None, _error("Account is unavailable.", 401)

    business = None

    if user.business_id is not None:
        business = db.session.get(Business, user.business_id)

        if not business_is_open(business):
            return None, None, _error(
                "This business is not active. Contact support.", 403
            )

    return user, business, None


def _attach(user, business):
    g.user = user
    g.business = business

    # Compatibility with code written for the old single admin.
    g.admin = {
        "username": user.email,
        "role": user.role,
        "user_id": user.id,
    }

    # The tenant comes from the database row, never from the token.
    set_tenant(business.id if business else None)


def admin_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        user, business, error = _authenticate_staff()

        if error:
            return error

        if user.role not in BUSINESS_ADMIN_ROLES:
            return _error("Business administrator access required.", 403)

        _attach(user, business)

        return view_function(*args, **kwargs)

    return wrapped


def super_admin_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        user, business, error = _authenticate_staff()

        if error:
            return error

        if user.role != "super_admin":
            return _error("Platform administrator access required.", 403)

        _attach(user, None)

        return view_function(*args, **kwargs)

    return wrapped


def permission_required(permission):
    """Any business staff role that holds the named permission."""

    def decorator(view_function):
        @wraps(view_function)
        def wrapped(*args, **kwargs):
            user, business, error = _authenticate_staff()

            if error:
                return error

            if user.role == "super_admin":
                return _error("Business access required.", 403)

            if not has_permission(user, permission):
                return _error("You do not have permission.", 403)

            _attach(user, business)

            return view_function(*args, **kwargs)

        return wrapped

    return decorator
