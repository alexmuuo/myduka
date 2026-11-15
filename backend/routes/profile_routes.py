import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from extensions import db
from auth import supabase_auth_required
from models.user import Profile

logger = logging.getLogger("myduka.profile")

profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api/profile"
)


def serialize_profile(profile):
    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "phone": profile.phone,
        "email": profile.email,
        "created_at": (
            profile.created_at.isoformat()
            if profile.created_at else None
        ),
        "updated_at": (
            profile.updated_at.isoformat()
            if profile.updated_at else None
        )
    }


def get_or_create_profile():
    profile = Profile.query.filter_by(
        id=g.current_user_id
    ).first()

    if profile:
        return profile

    metadata = g.current_user.get("user_metadata") or {}

    profile = Profile(
        id=g.current_user_id,
        full_name=metadata.get("full_name")
        or metadata.get("name"),
        phone=metadata.get("phone"),
        email=g.current_user.get("email")
    )

    db.session.add(profile)
    db.session.flush()

    return profile


@profile_bp.route("/me", methods=["GET"])
@supabase_auth_required
def get_my_profile():
    try:
        profile = get_or_create_profile()

        # Keep the profile email synchronized with verified Auth data.
        profile.email = g.current_user.get("email")

        db.session.commit()

        return jsonify({
            "status": "success",
            "profile": serialize_profile(profile)
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve user profile."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve your profile."
        }), 500

    finally:
        db.session.remove()


@profile_bp.route("/me", methods=["PATCH"])
@supabase_auth_required
def update_my_profile():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    allowed_fields = {"full_name", "phone"}

    if not data or not set(data.keys()).issubset(allowed_fields):
        return jsonify({
            "status": "error",
            "message": "Only full_name and phone can be updated."
        }), 400

    full_name = data.get("full_name")
    phone = data.get("phone")

    if "full_name" in data:
        if not isinstance(full_name, str):
            return jsonify({
                "status": "error",
                "message": "Full name must be text."
            }), 400

        full_name = full_name.strip()

        if not full_name or len(full_name) > 150:
            return jsonify({
                "status": "error",
                "message": "Full name must contain 1–150 characters."
            }), 400

    if "phone" in data:
        if phone is not None and not isinstance(phone, str):
            return jsonify({
                "status": "error",
                "message": "Phone number must be text."
            }), 400

        phone = phone.strip() if phone else None

        if phone and len(phone) > 30:
            return jsonify({
                "status": "error",
                "message": "Phone number cannot exceed 30 characters."
            }), 400

    try:
        profile = get_or_create_profile()

        if "full_name" in data:
            profile.full_name = full_name

        if "phone" in data:
            profile.phone = phone

        # Email is controlled by Supabase Auth, not this endpoint.
        profile.email = g.current_user.get("email")
        profile.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully.",
            "profile": serialize_profile(profile)
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update user profile."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update your profile."
        }), 500

    finally:
        db.session.remove()
