import logging

from flask import Blueprint, request, jsonify, g
from sqlalchemy import text

from extensions import db
from auth import business_permission_required


logger = logging.getLogger("myduka.branches")

branch_bp = Blueprint(
    "branches",
    __name__,
    url_prefix="/api/businesses"
)


def check_business_access(business_id):
    if str(business_id) != str(g.business_id):
        return jsonify({
            "status": "error",
            "message": "Business access denied."
        }), 403

    return None


def serialize_branch(row):
    return {
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
    }


# ============================================================
# UPDATE BRANCH DETAILS
# ============================================================

@branch_bp.route(
    "/<uuid:business_id>/branches/<uuid:branch_id>",
    methods=["PUT"]
)
@business_permission_required("branches.update")
def update_branch(business_id, branch_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    allowed_fields = {
        "name",
        "phone",
        "address"
    }

    unsupported = set(data.keys()) - allowed_fields

    if unsupported:
        return jsonify({
            "status": "error",
            "message": (
                "Unsupported fields: "
                + ", ".join(sorted(unsupported))
            )
        }), 400

    if not data:
        return jsonify({
            "status": "error",
            "message": "Provide at least one field to update."
        }), 400

    try:

        branch = db.session.execute(
            text("""
                SELECT *
                FROM public.branches
                WHERE id = :branch_id
                  AND business_id = :business_id
                LIMIT 1
            """),
            {
                "branch_id": branch_id,
                "business_id": g.business_id
            }
        ).mappings().first()

        if not branch:
            return jsonify({
                "status": "error",
                "message": "Branch not found."
            }), 404

        name = data.get("name", branch["name"])

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "status": "error",
                "message": "Branch name is required."
            }), 400

        name = name.strip()

        if len(name) > 150:
            return jsonify({
                "status": "error",
                "message": "Branch name cannot exceed 150 characters."
            }), 400

        existing = db.session.execute(
            text("""
                SELECT id
                FROM public.branches
                WHERE business_id = :business_id
                  AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
                  AND id != :branch_id
                LIMIT 1
            """),
            {
                "business_id": g.business_id,
                "name": name,
                "branch_id": branch_id
            }
        ).first()

        if existing:
            return jsonify({
                "status": "error",
                "message": "A branch with this name already exists."
            }), 409

        phone = data.get("phone", branch["phone"])

        if phone is not None:
            phone = str(phone).strip() or None

            if phone and len(phone) > 30:
                return jsonify({
                    "status": "error",
                    "message": "Phone number cannot exceed 30 characters."
                }), 400

        address = data.get("address", branch["address"])

        if address is not None:
            address = str(address).strip() or None

            if address and len(address) > 500:
                return jsonify({
                    "status": "error",
                    "message": "Address cannot exceed 500 characters."
                }), 400

        result = db.session.execute(
            text("""
                UPDATE public.branches
                SET
                    name = :name,
                    phone = :phone,
                    address = :address,
                    updated_at = NOW()
                WHERE id = :branch_id
                  AND business_id = :business_id
                RETURNING *
            """),
            {
                "name": name,
                "phone": phone,
                "address": address,
                "branch_id": branch_id,
                "business_id": g.business_id
            }
        )

        updated = result.mappings().one()

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Branch updated successfully.",
            "branch": serialize_branch(updated)
        }), 200

    except Exception:

        db.session.rollback()

        logger.exception(
            "Failed to update branch %s.",
            branch_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update branch."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# ACTIVATE OR DEACTIVATE BRANCH
# ============================================================

@branch_bp.route(
    "/<uuid:business_id>/branches/<uuid:branch_id>/status",
    methods=["PATCH"]
)
@business_permission_required("branches.update")
def update_branch_status(business_id, branch_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required."
        }), 400

    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    try:

        branch = db.session.execute(
            text("""
                SELECT id, name, is_main, is_active
                FROM public.branches
                WHERE id = :branch_id
                  AND business_id = :business_id
                LIMIT 1
            """),
            {
                "branch_id": branch_id,
                "business_id": g.business_id
            }
        ).mappings().first()

        if not branch:
            return jsonify({
                "status": "error",
                "message": "Branch not found."
            }), 404

        if branch["is_main"] and not is_active:
            return jsonify({
                "status": "error",
                "message": "The Main Branch cannot be deactivated."
            }), 403

        result = db.session.execute(
            text("""
                UPDATE public.branches
                SET
                    is_active = :is_active,
                    updated_at = NOW()
                WHERE id = :branch_id
                  AND business_id = :business_id
                RETURNING *
            """),
            {
                "is_active": is_active,
                "branch_id": branch_id,
                "business_id": g.business_id
            }
        )

        updated = result.mappings().one()

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Branch activated successfully."
                if is_active
                else "Branch deactivated successfully."
            ),
            "branch": serialize_branch(updated)
        }), 200

    except Exception:

        db.session.rollback()

        logger.exception(
            "Failed to update branch status for %s.",
            branch_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update branch status."
        }), 500

    finally:
        db.session.remove()
