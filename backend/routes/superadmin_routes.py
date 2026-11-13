from flask import Blueprint, jsonify

from sqlalchemy import desc

from extensions import db

from auth import platform_admin_required

from models.business import Business
from models.user import Profile
from models.business_member import BusinessMember


superadmin_bp = Blueprint(
    "superadmin",
    __name__,
    url_prefix="/api/superadmin"
)


# ==================================================
# SUPER ADMIN PROFILE
# ==================================================

@superadmin_bp.route("/me", methods=["GET"])
@platform_admin_required
def superadmin_me():

    admin = {
        "id": str(g.platform_admin.id),
        "user_id": str(g.platform_admin.user_id),
        "is_active": g.platform_admin.is_active
    }

    return jsonify({
        "status": "success",
        "is_superadmin": True,
        "admin": admin,
        "user": {
            "id": str(g.current_user_id),
            "email": g.current_user.get("email"),
            "full_name": (
                g.current_user.get("user_metadata", {}).get("full_name")
            )
        }
    }), 200


# ==================================================
# PLATFORM DASHBOARD OVERVIEW
# ==================================================

@superadmin_bp.route("/dashboard", methods=["GET"])
@platform_admin_required
def superadmin_dashboard():

    try:

        # ------------------------------------------
        # BUSINESS STATISTICS
        # ------------------------------------------

        total_businesses = Business.query.count()

        active_businesses = Business.query.filter_by(
            is_active=True
        ).count()

        inactive_businesses = Business.query.filter_by(
            is_active=False
        ).count()

        # ------------------------------------------
        # USER STATISTICS
        # ------------------------------------------

        total_users = Profile.query.count()

        total_memberships = BusinessMember.query.filter_by(
            is_active=True
        ).count()

        # ------------------------------------------
        # RECENT BUSINESSES
        # ------------------------------------------

        recent_businesses = (
            Business.query
            .order_by(desc(Business.created_at))
            .limit(10)
            .all()
        )

        recent_list = [
            {
                "id": str(business.id),
                "name": business.name,
                "slug": business.slug,
                "email": business.email,
                "phone": business.phone,
                "is_active": business.is_active,
                "created_at": (
                    business.created_at.isoformat()
                    if business.created_at else None
                )
            }
            for business in recent_businesses
        ]

        # ------------------------------------------
        # PLATFORM ADMIN STATISTICS
        # ------------------------------------------

        from models.platform_admin import PlatformAdmin

        total_platform_admins = PlatformAdmin.query.filter_by(
            is_active=True
        ).count()

        # ------------------------------------------
        # RESPONSE
        # ------------------------------------------

        return jsonify({

            "status": "success",

            "statistics": {
                "total_businesses": total_businesses,
                "active_businesses": active_businesses,
                "inactive_businesses": inactive_businesses,
                "total_users": total_users,
                "total_memberships": total_memberships,
                "total_platform_admins": total_platform_admins
            },

            "recent_businesses": recent_list

        }), 200

    except Exception:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to load platform dashboard."
        }), 500
