import logging
import re

from uuid import UUID

from flask import Blueprint, request, jsonify, g

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from extensions import db

from auth import business_member_required

from models.category import Category
from models.product import Product


category_bp = Blueprint(
    "category_bp",
    __name__
)

logger = logging.getLogger("myduka.categories")


# ============================================================
# VALIDATION HELPERS
# ============================================================

def validate_category_name(value):
    if not isinstance(value, str):
        return None

    value = value.strip()

    if not value:
        return None

    if len(value) > 100:
        return None

    return value


def validate_description(value):
    if value is None:
        return None

    if not isinstance(value, str):
        return False

    value = value.strip()

    if len(value) > 1000:
        return False

    return value or None


def validate_color(value):
    if value is None:
        return "#64748b"

    if not isinstance(value, str):
        return None

    value = value.strip()

    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        return None

    return value


def validate_icon(value):
    if value is None:
        return None

    if not isinstance(value, str):
        return False

    value = value.strip()

    if len(value) > 100:
        return False

    return value or None


def validate_boolean(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in ("true", "1"):
            return True

        if normalized in ("false", "0"):
            return False

    return None


def validate_payload():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return None

    return data


def verify_business_scope(business_id):
    """
    Ensure the business in the URL matches the business
    authenticated by business_member_required.
    """

    if str(g.business_id) != str(business_id):
        return False

    return True


def category_name_exists(
    business_id,
    name,
    exclude_id=None
):
    query = Category.query.filter(
        Category.business_id == business_id,
        func.lower(Category.name) == name.lower()
    )

    if exclude_id:
        query = query.filter(
            Category.id != exclude_id
        )

    return query.first() is not None


def category_used_by_products(category_name):
    """
    The current Product model stores category as plain text.

    Until product records are migrated to a proper category_id
    relationship, use a conservative check before deletion or
    renaming.

    This checks all matching product names because the existing
    Product model does not currently provide reliable UUID-based
    business scoping.
    """

    return Product.query.filter(
        func.lower(Product.category) == category_name.lower()
    ).first() is not None


# ============================================================
# GET CATEGORIES
# ============================================================

@category_bp.route(
    "/api/businesses/<uuid:business_id>/categories",
    methods=["GET"]
)
@business_member_required("owner", "admin", "manager")
def get_categories(business_id):

    if not verify_business_scope(business_id):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this business."
        }), 403

    try:
        include_inactive = (
            request.args.get("include_inactive", "false").lower()
            in ("true", "1")
        )

        query = Category.query.filter_by(
            business_id=business_id
        )

        if not include_inactive:
            query = query.filter_by(
                is_active=True
            )

        categories = query.order_by(
            func.lower(Category.name).asc()
        ).all()

        return jsonify({
            "status": "success",
            "categories": [
                category.to_dict()
                for category in categories
            ],
            "total": len(categories)
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve categories."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve categories."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# CREATE CATEGORY
# ============================================================

@category_bp.route(
    "/api/businesses/<uuid:business_id>/categories",
    methods=["POST"]
)
@business_member_required("owner", "admin", "manager")
def create_category(business_id):

    if not verify_business_scope(business_id):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this business."
        }), 403

    data = validate_payload()

    if data is None:
        return jsonify({
            "status": "error",
            "message": "A valid JSON payload is required."
        }), 400

    name = validate_category_name(
        data.get("name")
    )

    if not name:
        return jsonify({
            "status": "error",
            "message": "Category name is required and must not exceed 100 characters."
        }), 400

    description = validate_description(
        data.get("description")
    )

    if description is False:
        return jsonify({
            "status": "error",
            "message": "Description must be a string of at most 1000 characters."
        }), 400

    color = validate_color(
        data.get("color")
    )

    if color is None:
        return jsonify({
            "status": "error",
            "message": "Enter a valid hexadecimal color."
        }), 400

    icon = validate_icon(
        data.get("icon")
    )

    if icon is False:
        return jsonify({
            "status": "error",
            "message": "Icon must be a string of at most 100 characters."
        }), 400

    is_active = validate_boolean(
        data.get("is_active", True)
    )

    if is_active is None:
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    try:
        if category_name_exists(
            business_id,
            name
        ):
            return jsonify({
                "status": "error",
                "message": "A category with this name already exists."
            }), 409

        category = Category(
            business_id=business_id,
            name=name,
            description=description,
            color=color,
            icon=icon,
            is_active=is_active
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Category created successfully.",
            "category": category.to_dict()
        }), 201

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "A category with this name already exists."
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to create category."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to create category."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# UPDATE CATEGORY
# ============================================================

@category_bp.route(
    "/api/businesses/<uuid:business_id>/categories/<uuid:category_id>",
    methods=["PUT"]
)
@business_member_required("owner", "admin", "manager")
def update_category(
    business_id,
    category_id
):

    if not verify_business_scope(business_id):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this business."
        }), 403

    data = validate_payload()

    if data is None:
        return jsonify({
            "status": "error",
            "message": "A valid JSON payload is required."
        }), 400

    try:
        category = Category.query.filter_by(
            id=category_id,
            business_id=business_id
        ).first()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        if "name" in data:
            name = validate_category_name(
                data["name"]
            )

            if not name:
                return jsonify({
                    "status": "error",
                    "message": "Category name is required and must not exceed 100 characters."
                }), 400

            if name.lower() != category.name.lower():

                if category_used_by_products(category.name):
                    return jsonify({
                        "status": "error",
                        "message": "This category is already used by products. Its name cannot be changed until product-category relationships are migrated."
                    }), 409

                if category_name_exists(
                    business_id,
                    name,
                    exclude_id=category.id
                ):
                    return jsonify({
                        "status": "error",
                        "message": "A category with this name already exists."
                    }), 409

            category.name = name

        if "description" in data:
            description = validate_description(
                data["description"]
            )

            if description is False:
                return jsonify({
                    "status": "error",
                    "message": "Description must be a string of at most 1000 characters."
                }), 400

            category.description = description

        if "color" in data:
            color = validate_color(
                data["color"]
            )

            if color is None:
                return jsonify({
                    "status": "error",
                    "message": "Enter a valid hexadecimal color."
                }), 400

            category.color = color

        if "icon" in data:
            icon = validate_icon(
                data["icon"]
            )

            if icon is False:
                return jsonify({
                    "status": "error",
                    "message": "Icon must be a string of at most 100 characters."
                }), 400

            category.icon = icon

        if "is_active" in data:
            is_active = validate_boolean(
                data["is_active"]
            )

            if is_active is None:
                return jsonify({
                    "status": "error",
                    "message": "is_active must be true or false."
                }), 400

            category.is_active = is_active

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Category updated successfully.",
            "category": category.to_dict()
        }), 200

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "A category with this name already exists."
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update category."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update category."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# ACTIVATE / DEACTIVATE CATEGORY
# ============================================================

@category_bp.route(
    "/api/businesses/<uuid:business_id>/categories/<uuid:category_id>/status",
    methods=["PATCH"]
)
@business_member_required("owner", "admin", "manager")
def update_category_status(
    business_id,
    category_id
):

    if not verify_business_scope(business_id):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this business."
        }), 403

    data = validate_payload()

    if data is None or "is_active" not in data:
        return jsonify({
            "status": "error",
            "message": "is_active is required."
        }), 400

    is_active = validate_boolean(
        data.get("is_active")
    )

    if is_active is None:
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    try:
        category = Category.query.filter_by(
            id=category_id,
            business_id=business_id
        ).first()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        category.is_active = is_active

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Category activated successfully."
                if is_active
                else "Category deactivated successfully."
            ),
            "category": category.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update category status."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update category status."
        }), 500

    finally:
        db.session.remove()


# ============================================================
# DELETE CATEGORY
# ============================================================

@category_bp.route(
    "/api/businesses/<uuid:business_id>/categories/<uuid:category_id>",
    methods=["DELETE"]
)
@business_member_required("owner", "admin")
def delete_category(
    business_id,
    category_id
):

    if not verify_business_scope(business_id):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this business."
        }), 403

    try:
        category = Category.query.filter_by(
            id=category_id,
            business_id=business_id
        ).first()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        if category_used_by_products(category.name):
            return jsonify({
                "status": "error",
                "message": "This category is assigned to existing products. Deactivate it instead of deleting it."
            }), 409

        category_name = category.name

        db.session.delete(category)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Category '{category_name}' deleted successfully."
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to delete category."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to delete category."
        }), 500

    finally:
        db.session.remove()
