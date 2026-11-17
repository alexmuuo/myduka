import os
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import requests

from flask import Blueprint, request, jsonify, g
from sqlalchemy import text

from supabase import create_client
from supabase.lib.client_options import ClientOptions

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
# HELPERS
# ==================================================

def get_admin_supabase():
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    secret_key = os.getenv("SUPABASE_SECRET_KEY", "")

    if not supabase_url or not secret_key:
        raise RuntimeError(
            "Supabase server configuration is incomplete."
        )

    return create_client(
        supabase_url,
        secret_key,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False
        )
    )


def get_invited_user_id(response):
    user = getattr(response, "user", None)

    if user is None and isinstance(response, dict):
        user = response.get("user")

    user_id = (
        user.get("id")
        if isinstance(user, dict)
        else getattr(user, "id", None)
    )

    if not user_id:
        raise ValueError(
            "Supabase invitation returned no user ID."
        )

    return UUID(str(user_id))


def get_auth_user_email(admin_client, user_id):
    try:
        response = admin_client.auth.admin.get_user_by_id(
            str(user_id)
        )

        user = getattr(response, "user", None)

        if user is None and isinstance(response, dict):
            user = response.get("user")

        if isinstance(user, dict):
            return user.get("email")

        return getattr(user, "email", None)

    except Exception:
        logger.exception(
            "Could not retrieve email for user %s.",
            user_id
        )
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


def validate_branch_ids(branch_ids, business_id):
    if not isinstance(branch_ids, list) or not branch_ids:
        raise ValueError(
            "Assign the employee to at least one branch."
        )

    try:
        branch_uuids = list(dict.fromkeys(
            UUID(str(branch_id))
            for branch_id in branch_ids
        ))
    except (ValueError, TypeError):
        raise ValueError(
            "One or more branch IDs are invalid."
        )

    valid_branches = []

    for branch_id in branch_uuids:
        branch = db.session.execute(
            text("""
                SELECT id, name
                FROM public.branches
                WHERE id = :branch_id
                  AND business_id = :business_id
                  AND is_active = TRUE
                LIMIT 1
            """),
            {
                "branch_id": branch_id,
                "business_id": business_id
            }
        ).mappings().first()

        if not branch:
            raise ValueError(
                "A selected branch is invalid or inactive."
            )

        valid_branches.append(branch)

    return valid_branches


def serialize_staff_member(member, branches, email=None):
    return {
        "membership_id": str(member["membership_id"]),
        "user_id": str(member["user_id"]),
        "email": email,
        "role": member["role"],
        "is_active": member["is_active"],
        "created_at": (
            member["created_at"].isoformat()
            if member["created_at"] else None
        ),
        "branches": [
            {
                "id": str(branch["branch_id"]),
                "name": branch["branch_name"]
            }
            for branch in branches
        ]
    }


def check_business_access(business_id):
    if business_id != g.business_id:
        return jsonify({
            "status": "error",
            "message": "Business access denied."
        }), 403

    return None


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

    denied = check_business_access(business_id)

    if denied:
        return denied

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

        branches = [
            serialize_branch(row)
            for row in result.mappings()
        ]

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


# ==================================================
# CREATE BUSINESS BRANCH
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/branches",
    methods=["POST"]
)
@business_member_required("owner", "admin", "manager")
def create_branch(business_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    phone = data.get("phone")
    address = data.get("address")

    if not name:
        return jsonify({
            "status": "error",
            "message": "Branch name is required."
        }), 400

    if len(name) > 150:
        return jsonify({
            "status": "error",
            "message": "Branch name cannot exceed 150 characters."
        }), 400

    if phone is not None:
        phone = str(phone).strip() or None

        if len(phone or "") > 30:
            return jsonify({
                "status": "error",
                "message": "Branch phone number is too long."
            }), 400

    if address is not None:
        address = str(address).strip() or None

    try:
        existing_branch = db.session.execute(
            text("""
                SELECT id
                FROM public.branches
                WHERE business_id = :business_id
                  AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
                LIMIT 1
            """),
            {
                "business_id": g.business_id,
                "name": name
            }
        ).first()

        if existing_branch:
            return jsonify({
                "status": "error",
                "message": "A branch with this name already exists."
            }), 409

        result = db.session.execute(
            text("""
                INSERT INTO public.branches (
                    business_id,
                    name,
                    phone,
                    address,
                    is_main,
                    is_active
                )
                VALUES (
                    :business_id,
                    :name,
                    :phone,
                    :address,
                    FALSE,
                    TRUE
                )
                RETURNING
                    id,
                    business_id,
                    name,
                    phone,
                    address,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
            """),
            {
                "business_id": g.business_id,
                "name": name,
                "phone": phone,
                "address": address
            }
        )

        row = result.mappings().one()

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Branch created successfully.",
            "branch": serialize_branch(row)
        }), 201

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to create branch for business %s.",
            business_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to create branch."
        }), 500

    finally:
        db.session.remove()


# ==================================================
# LIST BUSINESS STAFF
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/staff",
    methods=["GET"]
)
@business_member_required("owner", "admin", "manager")
def list_business_staff(business_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    try:
        members = db.session.execute(
            text("""
                SELECT
                    bm.id AS membership_id,
                    bm.user_id,
                    bm.role,
                    bm.is_active,
                    bm.created_at
                FROM public.business_members bm
                WHERE bm.business_id = :business_id
                ORDER BY bm.created_at ASC
            """),
            {
                "business_id": g.business_id
            }
        ).mappings().all()

        admin_client = get_admin_supabase()
        staff = []

        for member in members:

            assignments = db.session.execute(
                text("""
                    SELECT
                        b.id AS branch_id,
                        b.name AS branch_name
                    FROM public.branch_staff bs
                    JOIN public.branches b
                      ON b.id = bs.branch_id
                     AND b.business_id = bs.business_id
                    WHERE bs.business_id = :business_id
                      AND bs.user_id = :user_id
                      AND bs.is_active = TRUE
                    ORDER BY b.name ASC
                """),
                {
                    "business_id": g.business_id,
                    "user_id": member["user_id"]
                }
            ).mappings().all()

            email = get_auth_user_email(
                admin_client,
                member["user_id"]
            )

            staff.append(
                serialize_staff_member(
                    member,
                    assignments,
                    email
                )
            )

        return jsonify({
            "status": "success",
            "staff": staff
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve staff for business %s.",
            business_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve business staff."
        }), 500

    finally:
        db.session.remove()


# ==================================================
# INVITE BUSINESS STAFF
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/staff/invite",
    methods=["POST"]
)
@business_member_required("owner", "admin")
def invite_business_staff(business_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    role = str(data.get("role", "")).strip().lower()
    branch_ids = data.get("branch_ids")

    if not email or len(email) > 254 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        email
    ):
        return jsonify({
            "status": "error",
            "message": "Enter a valid email address."
        }), 400

    if role not in ("admin", "manager", "cashier"):
        return jsonify({
            "status": "error",
            "message": "Role must be admin, manager or cashier."
        }), 400

    try:
        valid_branches = validate_branch_ids(
            branch_ids,
            g.business_id
        )

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    try:
        admin_client = get_admin_supabase()

        invitation = admin_client.auth.admin.invite_user_by_email(
            email
        )

        invited_user_id = get_invited_user_id(invitation)

        existing_membership = BusinessMember.query.filter_by(
            business_id=g.business_id,
            user_id=invited_user_id
        ).first()

        if existing_membership:
            return jsonify({
                "status": "error",
                "message": "This user already belongs to the business."
            }), 409

        membership = BusinessMember(
            business_id=g.business_id,
            user_id=invited_user_id,
            role=role,
            is_active=True
        )

        db.session.add(membership)
        db.session.flush()

        for branch in valid_branches:
            db.session.execute(
                text("""
                    INSERT INTO public.branch_staff (
                        business_id,
                        branch_id,
                        user_id,
                        is_active
                    )
                    VALUES (
                        :business_id,
                        :branch_id,
                        :user_id,
                        TRUE
                    )
                """),
                {
                    "business_id": g.business_id,
                    "branch_id": branch["id"],
                    "user_id": invited_user_id
                }
            )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Staff invitation sent successfully.",
            "staff": {
                "user_id": str(invited_user_id),
                "email": email,
                "role": role,
                "is_active": True,
                "branches": [
                    {
                        "id": str(branch["id"]),
                        "name": branch["name"]
                    }
                    for branch in valid_branches
                ]
            }
        }), 201

    except Exception as error:
        db.session.rollback()

        logger.exception(
            "Failed to invite staff member to business %s.",
            business_id
        )

        error_message = str(error).lower()

        if (
            "already registered" in error_message
            or "already been registered" in error_message
            or "already exists" in error_message
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "This email may already have a Supabase account. "
                    "Existing-user staff assignment will be supported separately."
                )
            }), 409

        return jsonify({
            "status": "error",
            "message": "Unable to invite this employee. Check the server logs."
        }), 500

    finally:
        db.session.remove()


# ==================================================
# UPDATE STAFF ROLE AND BRANCH ASSIGNMENTS
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/staff/<uuid:user_id>",
    methods=["PUT"]
)
@business_member_required("owner", "admin")
def update_business_staff(business_id, user_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True) or {}

    role = str(data.get("role", "")).strip().lower()
    branch_ids = data.get("branch_ids")

    if role not in ("admin", "manager", "cashier"):
        return jsonify({
            "status": "error",
            "message": "Role must be admin, manager or cashier."
        }), 400

    try:
        valid_branches = validate_branch_ids(
            branch_ids,
            g.business_id
        )

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    try:
        membership = BusinessMember.query.filter_by(
            business_id=g.business_id,
            user_id=user_id
        ).first()

        if not membership:
            return jsonify({
                "status": "error",
                "message": "Staff member not found."
            }), 404

        if str(user_id) == str(g.current_user_id):
            return jsonify({
                "status": "error",
                "message": "You cannot change your own staff role or assignments."
            }), 403

        membership.role = role

        selected_ids = {
            str(branch["id"])
            for branch in valid_branches
        }

        existing_assignments = db.session.execute(
            text("""
                SELECT id, branch_id
                FROM public.branch_staff
                WHERE business_id = :business_id
                  AND user_id = :user_id
            """),
            {
                "business_id": g.business_id,
                "user_id": user_id
            }
        ).mappings().all()

        existing_by_branch = {
            str(row["branch_id"]): row
            for row in existing_assignments
        }

        for branch in valid_branches:
            branch_id = str(branch["id"])

            existing = existing_by_branch.get(branch_id)

            if existing:
                db.session.execute(
                    text("""
                        UPDATE public.branch_staff
                        SET is_active = TRUE
                        WHERE id = :assignment_id
                    """),
                    {
                        "assignment_id": existing["id"]
                    }
                )
            else:
                db.session.execute(
                    text("""
                        INSERT INTO public.branch_staff (
                            business_id,
                            branch_id,
                            user_id,
                            is_active
                        )
                        VALUES (
                            :business_id,
                            :branch_id,
                            :user_id,
                            TRUE
                        )
                    """),
                    {
                        "business_id": g.business_id,
                        "branch_id": branch["id"],
                        "user_id": user_id
                    }
                )

        for branch_id, assignment in existing_by_branch.items():
            if branch_id not in selected_ids:
                db.session.execute(
                    text("""
                        UPDATE public.branch_staff
                        SET is_active = FALSE
                        WHERE id = :assignment_id
                    """),
                    {
                        "assignment_id": assignment["id"]
                    }
                )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Staff details updated successfully.",
            "staff": {
                "user_id": str(user_id),
                "role": role,
                "branches": [
                    {
                        "id": str(branch["id"]),
                        "name": branch["name"]
                    }
                    for branch in valid_branches
                ]
            }
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update staff member %s.",
            user_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update staff details."
        }), 500

    finally:
        db.session.remove()


# ==================================================
# ACTIVATE OR SUSPEND STAFF ACCOUNT
# ==================================================

@business_bp.route(
    "/<uuid:business_id>/staff/<uuid:user_id>/status",
    methods=["PATCH"]
)
@business_member_required("owner", "admin")
def update_business_staff_status(business_id, user_id):

    denied = check_business_access(business_id)

    if denied:
        return denied

    data = request.get_json(silent=True) or {}

    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    if str(user_id) == str(g.current_user_id):
        return jsonify({
            "status": "error",
            "message": "You cannot suspend or deactivate your own account."
        }), 403

    try:
        membership = BusinessMember.query.filter_by(
            business_id=g.business_id,
            user_id=user_id
        ).first()

        if not membership:
            return jsonify({
                "status": "error",
                "message": "Staff member not found."
            }), 404

        membership.is_active = is_active

        db.session.execute(
            text("""
                UPDATE public.branch_staff
                SET is_active = :is_active
                WHERE business_id = :business_id
                  AND user_id = :user_id
            """),
            {
                "is_active": is_active,
                "business_id": g.business_id,
                "user_id": user_id
            }
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Staff account activated successfully."
                if is_active
                else "Staff account suspended successfully."
            ),
            "staff": {
                "user_id": str(user_id),
                "is_active": is_active
            }
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to change staff status for user %s.",
            user_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update staff account status."
        }), 500

    finally:
        db.session.remove()
