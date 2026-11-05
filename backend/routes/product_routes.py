import logging
import uuid

from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

from flask import g, Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.product import Product
from models.branch import Branch
from models.branch_product_stock import BranchProductStock
from admin_auth import admin_required
from plans import check_plan_limit
from tenancy import shop_context_required


product_bp = Blueprint("product_bp", __name__)
logger = logging.getLogger(__name__)


# ============================================================
# IMAGE CONFIGURATION
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent.parent
PRODUCT_IMAGE_DIR = BACKEND_DIR / "uploads" / "products"

MAX_IMAGE_SIZE = 5 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

ALLOWED_IMAGE_MIMETYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def ensure_image_directory():
    PRODUCT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def validate_image_file(file):
    if not file or not file.filename:
        return False, "Please select an image."

    original_name = secure_filename(file.filename)

    if not original_name or "." not in original_name:
        return False, "The image filename is invalid."

    extension = original_name.rsplit(".", 1)[1].lower()

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Unsupported image format. Use JPG, JPEG, PNG, WEBP, or GIF."

    if file.mimetype not in ALLOWED_IMAGE_MIMETYPES:
        return False, "The uploaded file must be an image."

    file.stream.seek(0)
    image_bytes = file.stream.read(MAX_IMAGE_SIZE + 1)
    file.stream.seek(0)

    if len(image_bytes) > MAX_IMAGE_SIZE:
        return False, "Image size must not exceed 5 MB."

    if not image_bytes:
        return False, "The uploaded image is empty."

    is_jpeg = image_bytes.startswith(b"\xff\xd8\xff")
    is_png = image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_gif = image_bytes.startswith((b"GIF87a", b"GIF89a"))
    is_webp = (
        len(image_bytes) >= 12
        and image_bytes.startswith(b"RIFF")
        and image_bytes[8:12] == b"WEBP"
    )

    signature_matches = {
        "jpg": is_jpeg,
        "jpeg": is_jpeg,
        "png": is_png,
        "gif": is_gif,
        "webp": is_webp,
    }

    if not signature_matches.get(extension, False):
        return False, "The file contents do not match the image format."

    return True, None


def save_product_image(file):
    ensure_image_directory()

    original_name = secure_filename(file.filename)
    extension = original_name.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{extension}"

    destination = PRODUCT_IMAGE_DIR / unique_filename
    file.save(str(destination))

    return f"/api/product-images/{unique_filename}"


def delete_local_product_image(image_path):
    if not image_path:
        return

    prefix = "/api/product-images/"

    if not image_path.startswith(prefix):
        return

    filename = image_path[len(prefix):]

    if not filename or Path(filename).name != filename:
        return

    target = PRODUCT_IMAGE_DIR / filename

    try:
        if target.is_file():
            target.unlink()
    except OSError:
        logger.exception("Could not delete product image: %s", filename)


# ============================================================
# REQUEST AND VALIDATION HELPERS
# ============================================================

def get_request_data():
    if request.is_json:
        data = request.get_json(silent=True)
        return data if isinstance(data, dict) else None

    return request.form.to_dict()


def validate_image_url(value):
    if value is None or value == "":
        return True

    if not isinstance(value, str):
        return False

    value = value.strip()

    if not value:
        return True

    if value.startswith("/"):
        return not value.startswith("//")

    parsed = urlparse(value)

    return (
        parsed.scheme in {"http", "https"}
        and bool(parsed.netloc)
    )


def validate_product_text(data, field):
    value = data.get(field)

    if not isinstance(value, str) or not value.strip():
        return None

    return value.strip()


def validate_decimal(value, minimum=Decimal("0"), max_decimal_places=2):
    """
    Parse a finite, non-negative decimal value.

    Decimal places are checked explicitly to prevent silent rounding
    of values that exceed the database column's intended precision.
    """
    if isinstance(value, bool) or value is None:
        return None

    try:
        number = Decimal(str(value).strip())

        if not number.is_finite() or number < minimum:
            return None

        exponent = number.as_tuple().exponent

        if exponent < -max_decimal_places:
            return None

        return number

    except (InvalidOperation, ValueError, TypeError, AttributeError):
        return None


def validate_price(value):
    return validate_decimal(value, max_decimal_places=2)


def validate_stock(value):
    """Accept non-negative stock values with up to three decimals."""
    return validate_decimal(value, max_decimal_places=3)


def validate_branch_id(value):
    if isinstance(value, bool) or value is None:
        return None

    try:
        branch_id = int(str(value).strip())

        if branch_id <= 0 or str(value).strip() != str(branch_id):
            return None

        return branch_id

    except (ValueError, TypeError, AttributeError):
        return None


def validate_boolean(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in {"true", "1"}:
            return True

        if normalized in {"false", "0"}:
            return False

    return None


def validate_portion_configuration(data, existing_product=None):
    """
    Validate portion settings.

    If portion selling is enabled, both portions_per_unit and
    portion_price are required. If disabled, portion selling settings
    are cleared to prevent stale configuration from being used.
    """
    current_enabled = (
        existing_product.allow_portion_sales
        if existing_product is not None
        else False
    )

    current_portions = (
        existing_product.portions_per_unit
        if existing_product is not None
        else None
    )

    current_portion_price = (
        existing_product.portion_price
        if existing_product is not None
        else None
    )

    if "allow_portion_sales" in data:
        enabled = validate_boolean(data["allow_portion_sales"])

        if enabled is None:
            return None, None, None, (
                "allow_portion_sales must be true or false."
            )
    else:
        enabled = current_enabled

    if not enabled:
        return False, None, None, None

    raw_portions = data.get("portions_per_unit", current_portions)

    if isinstance(raw_portions, bool) or raw_portions is None:
        return None, None, None, (
            "Enter how many portions can be sold from one stock unit."
        )

    try:
        portions = int(str(raw_portions).strip())

        if portions <= 0 or str(raw_portions).strip() != str(portions):
            raise ValueError

    except (ValueError, TypeError, AttributeError):
        return None, None, None, (
            "Portions per unit must be a positive whole number."
        )

    raw_portion_price = data.get("portion_price", current_portion_price)
    portion_price = validate_price(raw_portion_price)

    if portion_price is None:
        return None, None, None, (
            "Enter a valid non-negative selling price for each portion."
        )

    return True, portions, portion_price, None


# ============================================================
# SERVE UPLOADED PRODUCT IMAGES
# ============================================================

@product_bp.route("/api/product-images/<path:filename>", methods=["GET"])
def get_product_image(filename):
    if Path(filename).name != filename:
        return jsonify({
            "status": "error",
            "message": "Image not found.",
        }), 404

    if Path(filename).suffix.lower().lstrip(".") not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({
            "status": "error",
            "message": "Image not found.",
        }), 404

    ensure_image_directory()

    response = send_from_directory(
        str(PRODUCT_IMAGE_DIR),
        filename,
        conditional=True,
    )

    response.headers["X-Content-Type-Options"] = "nosniff"

    return response


# ============================================================
# GET ALL ACTIVE PRODUCTS — PUBLIC
# ============================================================

@product_bp.route("/api/products", methods=["GET"])
@shop_context_required
def get_products():
    products = Product.query.filter_by(is_active=True).all()

    return jsonify([product.to_dict() for product in products])


# ============================================================
# GET ONE ACTIVE PRODUCT — PUBLIC
# ============================================================

@product_bp.route("/api/products/<int:product_id>", methods=["GET"])
@shop_context_required
def get_product(product_id):
    product = db.session.get(Product, product_id)

    if not product or not product.is_active:
        return jsonify({
            "status": "error",
            "message": "Product not found.",
        }), 404

    return jsonify(product.to_dict())


# ============================================================
# CREATE PRODUCT — ADMIN ONLY
# ============================================================

@product_bp.route("/api/products", methods=["POST"])
@admin_required
def create_product():
    data = get_request_data()

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid product payload is required.",
        }), 400

    name = validate_product_text(data, "name")
    category = validate_product_text(data, "category")
    unit = validate_product_text(data, "unit")

    for field, value in {
        "name": name,
        "category": category,
        "unit": unit,
    }.items():
        if value is None:
            return jsonify({
                "status": "error",
                "message": f"{field} must be a non-empty string.",
            }), 400

    buying_price = validate_price(data.get("buying_price"))
    price = validate_price(data.get("price"))

    if buying_price is None:
        return jsonify({
            "status": "error",
            "message": "Buying price must be a valid non-negative number.",
        }), 400

    if price is None:
        return jsonify({
            "status": "error",
            "message": "Selling price must be a valid non-negative number.",
        }), 400

    stock = validate_stock(data.get("stock", 0))

    if stock is None:
        return jsonify({
            "status": "error",
            "message": "Stock must be a non-negative number with at most three decimal places.",
        }), 400

    branch_id = validate_branch_id(data.get("branch_id"))

    if branch_id is None:
        return jsonify({
            "status": "error",
            "message": "Select a valid branch.",
        }), 400

    initial_branch_stock = validate_stock(data.get("initial_branch_stock"))

    if initial_branch_stock is None:
        return jsonify({
            "status": "error",
            "message": "Initial branch stock must be a non-negative number with at most three decimal places.",
        }), 400

    is_active = validate_boolean(data.get("is_active", True))

    if is_active is None:
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false.",
        }), 400

    description = data.get("description", "")

    if description is not None and not isinstance(description, str):
        return jsonify({
            "status": "error",
            "message": "Description must be a string.",
        }), 400

    image_url = data.get("image", "")

    if not validate_image_url(image_url):
        return jsonify({
            "status": "error",
            "message": "Provide a valid HTTP(S) image URL or path.",
        }), 400

    allow_portion_sales, portions_per_unit, portion_price, portion_error = (
        validate_portion_configuration(data)
    )

    if portion_error:
        return jsonify({
            "status": "error",
            "message": portion_error,
        }), 400

    uploaded_file = request.files.get("image_file")
    saved_image_path = None

    try:
        branch = db.session.execute(
            select(Branch)
            .where(Branch.id == branch_id)
            .with_for_update()
        ).scalar_one_or_none()

        if branch is None:
            return jsonify({
                "status": "error",
                "message": "The selected branch does not exist.",
            }), 404

        if not branch.is_active:
            return jsonify({
                "status": "error",
                "message": "Products can only be assigned initial stock to an active branch.",
            }), 400

        if uploaded_file and uploaded_file.filename:
            valid, error_message = validate_image_file(uploaded_file)

            if not valid:
                return jsonify({
                    "status": "error",
                    "message": error_message,
                }), 400

            saved_image_path = save_product_image(uploaded_file)
            image_value = saved_image_path
        else:
            image_value = image_url.strip() or None

        limit_message = check_plan_limit(
            g.business, Product, "max_products"
        )

        if limit_message:
            return jsonify({
                "status": "error",
                "message": limit_message,
            }), 403

        product = Product(
            name=name,
            category=category,
            description=description,
            buying_price=buying_price,
            price=price,
            unit=unit,
            stock=stock,
            allow_portion_sales=allow_portion_sales,
            portions_per_unit=portions_per_unit,
            portion_price=portion_price,
            image=image_value,
            is_active=is_active,
        )

        db.session.add(product)
        db.session.flush()

        branch_stock = BranchProductStock(
            branch_id=branch.id,
            product_id=product.id,
            quantity=initial_branch_stock,
        )

        db.session.add(branch_stock)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Product and initial branch stock created successfully.",
            "product": product.to_dict(),
            "branch_stock": {
                "branch_id": branch.id,
                "branch_name": branch.name,
                "product_id": product.id,
                "quantity": float(branch_stock.quantity),
            },
        }), 201

    except IntegrityError:
        db.session.rollback()

        if saved_image_path:
            delete_local_product_image(saved_image_path)

        logger.exception("Database constraint failure while creating product.")

        return jsonify({
            "status": "error",
            "message": "The product or branch stock could not be created because of a database constraint. No database changes were saved.",
        }), 409

    except Exception:
        db.session.rollback()

        if saved_image_path:
            delete_local_product_image(saved_image_path)

        logger.exception("Failed to create product.")

        return jsonify({
            "status": "error",
            "message": "Unable to create product.",
        }), 500


# ============================================================
# UPDATE PRODUCT — ADMIN ONLY
#
# Does not change branch inventory.
# ============================================================

@product_bp.route("/api/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)

    if not product:
        return jsonify({
            "status": "error",
            "message": "Product not found.",
        }), 404

    data = get_request_data()

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid product payload is required.",
        }), 400

    for field in ("name", "category", "unit"):
        if field in data:
            if not isinstance(data[field], str) or not data[field].strip():
                return jsonify({
                    "status": "error",
                    "message": f"{field} must be a non-empty string.",
                }), 400

    if "buying_price" in data:
        buying_price = validate_price(data["buying_price"])

        if buying_price is None:
            return jsonify({
                "status": "error",
                "message": "Buying price must be a valid non-negative number.",
            }), 400

        product.buying_price = buying_price

    if "price" in data:
        price = validate_price(data["price"])

        if price is None:
            return jsonify({
                "status": "error",
                "message": "Selling price must be a valid non-negative number.",
            }), 400

        product.price = price

    if "stock" in data:
        stock = validate_stock(data["stock"])

        if stock is None:
            return jsonify({
                "status": "error",
                "message": "Stock must be a non-negative number with at most three decimal places.",
            }), 400

        product.stock = stock

    if "is_active" in data:
        is_active = validate_boolean(data["is_active"])

        if is_active is None:
            return jsonify({
                "status": "error",
                "message": "is_active must be true or false.",
            }), 400

        product.is_active = is_active

    for field in ("name", "category", "unit"):
        if field in data:
            setattr(product, field, data[field].strip())

    if "description" in data:
        description = data["description"]

        if description is not None and not isinstance(description, str):
            return jsonify({
                "status": "error",
                "message": "Description must be a string.",
            }), 400

        product.description = description

    (
        allow_portion_sales,
        portions_per_unit,
        portion_price,
        portion_error,
    ) = validate_portion_configuration(data, existing_product=product)

    if portion_error:
        return jsonify({
            "status": "error",
            "message": portion_error,
        }), 400

    product.allow_portion_sales = allow_portion_sales
    product.portions_per_unit = portions_per_unit
    product.portion_price = portion_price

    old_image_path = product.image
    saved_image_path = None
    uploaded_file = request.files.get("image_file")

    try:
        if uploaded_file and uploaded_file.filename:
            valid, error_message = validate_image_file(uploaded_file)

            if not valid:
                return jsonify({
                    "status": "error",
                    "message": error_message,
                }), 400

            saved_image_path = save_product_image(uploaded_file)
            product.image = saved_image_path

        elif "image" in data:
            image_url = data["image"]

            if not validate_image_url(image_url):
                return jsonify({
                    "status": "error",
                    "message": "Provide a valid HTTP(S) image URL or path.",
                }), 400

            product.image = image_url.strip() or None

        db.session.commit()

        if old_image_path and old_image_path != product.image:
            delete_local_product_image(old_image_path)

        return jsonify({
            "status": "success",
            "message": "Product updated successfully.",
            "product": product.to_dict(),
        }), 200

    except IntegrityError:
        db.session.rollback()

        if saved_image_path:
            delete_local_product_image(saved_image_path)

        logger.exception("Database constraint failure while updating product.")

        return jsonify({
            "status": "error",
            "message": "The product could not be updated because of a database constraint.",
        }), 409

    except Exception:
        db.session.rollback()

        if saved_image_path:
            delete_local_product_image(saved_image_path)

        logger.exception("Failed to update product.")

        return jsonify({
            "status": "error",
            "message": "Unable to update product.",
        }), 500


# ============================================================
# DEACTIVATE PRODUCT — ADMIN ONLY
# ============================================================

@product_bp.route("/api/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    product = db.session.get(Product, product_id)

    if not product:
        return jsonify({
            "status": "error",
            "message": "Product not found.",
        }), 404

    try:
        product.is_active = False
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Product deactivated successfully.",
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to deactivate product.")

        return jsonify({
            "status": "error",
            "message": "Unable to deactivate product.",
        }), 500

