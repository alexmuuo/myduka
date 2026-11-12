import os
import logging
import re
import requests

from flask import Blueprint, request, jsonify, g
from sqlalchemy import text

from extensions import db
from auth import supabase_auth_required, business_member_required
from models.business import Business
from models.business_member import BusinessMember


logger = logging.getLogger("myduka.business")

business_bp = Blueprint(
    "business",
    __name__,
    url_prefix="/api/businesses"
)


# ==================================================
# LIST USER BUSINESSES
# ==================================================

@business_bp.route("", methods=["GET"])
@supabase_auth_required
def list_businesses():

    memberships = (
        db.session.query(BusinessMember, Business)
        .join(
            Business,
            Business.id == BusinessMember.business_id
        )
        .filter(
            BusinessMember.user_id == g.current_user_id,
            BusinessMember.is_active.is_(True),
            Business.is_active.is_(True)
        )
        .order_by(Business.created_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "businesses": [
            {
                **business.to_dict(),
                "role": membership.role,
                "membership_id": str(membership.id)
            }
            for membership, business in memberships
        ]
    }), 200


# ==================================================
# CREATE BUSINESS
# ==================================================

@business_bp.route("", methods=["POST"])
@supabase_auth_required
def create_business():

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    slug = str(data.get("slug", "")).strip().lower()

    phone = data.get("phone")
    address = data.get("address")

    if not name or not slug:
        return jsonify({
            "status": "error",
            "message": "Business name and slug are required."
        }), 400

    if len(name) > 150:
        return jsonify({
            "status": "error",
            "message": "Business name cannot exceed 150 characters."
        }), 400

    if len(slug) > 60 or not re.fullmatch(
        r"[a-z0-9]+(?:-[a-z0-9]+)*",
        slug
    ):
        return jsonify({
            "status": "error",
            "message": "Use a valid lowercase slug with letters, numbers and hyphens."
        }), 400

    if phone is not None and len(str(phone)) > 30:
        return jsonify({
            "status": "error",
            "message": "Phone number is too long."
        }), 400

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_ANON_KEY", "")

    if not supabase_url or not supabase_key:
        logger.error("Supabase configuration is missing.")

        return jsonify({
            "status": "error",
            "message": "Business registration service is not configured."
        }), 503

    try:
        response = requests.post(
            f"{supabase_url}/rest/v1/rpc/create_business",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {g.supabase_access_token}",
                "Content-Type": "application/json"
            },
            json={
                "p_name": name,
                "p_slug": slug,
                "p_phone": phone,
                "p_address": address
            },
            timeout=20
        )

        if response.status_code not in (200, 201):
            logger.error(
                "Business registration failed. HTTP %s: %s",
                response.status_code,
                response.text
            )

            return jsonify({
                "status": "error",
                "message": "Business registration failed. Check the business details and try again."
            }), 400

        business_id = response.json()

        if isinstance(business_id, list):
            business_id = business_id[0] if business_id else None

        if isinstance(business_id, dict):
            business_id = business_id.get("create_business")

        if not business_id:
            logger.error("Supabase returned no business ID.")

            return jsonify({
                "status": "error",
                "message": "Business creation returned an invalid response."
            }), 500

        business = db.session.get(Business, business_id)

        if not business:
            logger.error(
                "Business %s was created but could not be retrieved.",
                business_id
            )

            return jsonify({
                "status": "error",
                "message": "Business was created, but could not be retrieved."
            }), 500

        return jsonify({
            "status": "success",
            "message": "Business created successfully.",
            "business": business.to_dict(),
            "role": "owner"
        }), 201

    except requests.RequestException:
        logger.exception(
            "Supabase business registration request failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to contact the registration service."
        }), 503

    except Exception:
        db.session.rollback()

        logger.exception(
            "Unexpected business registration error."
        )

        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred."
        }), 500

    finally:
        db.session.remove()


# ==================================================
# LIST BUSINESS BRANCHES
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/branches",
    methods=["GET"]
)
@business_member_required
def list_branches(business_id):

    # Ensure the URL business matches the authenticated business.
    if business_id != g.business_id:
        return jsonify({
            "status": "error",
            "message": "Business access denied."
        }), 403

    try:
        result = db.session.execute(
            text("""
                SELECT
                    id,
                    business_id,
                    name,
                    phone,
                    address,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
                FROM public.branches
                WHERE business_id = :business_id
                ORDER BY is_main DESC, created_at ASC
            """),
            {
                "business_id": g.business_id
            }
        )

        branches = []

        for row in result.mappings():

            branches.append({
                "id": str(row["id"]),
                "business_id": str(row["business_id"]),
                "name": row["name"],
                "phone": row["phone"],
                "address": row["address"],
                "is_main": row["is_main"],
                "is_active": row["is_active"],
                "created_at": (
                    row["created_at"].isoformat()
                    if row["created_at"] else None
                ),
                "updated_at": (
                    row["updated_at"].isoformat()
                    if row["updated_at"] else None
                )
            })

        return jsonify({
            "status": "success",
            "branches": branches
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve business branches."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve branches."
        }), 500

    finally:
        db.session.remove()
