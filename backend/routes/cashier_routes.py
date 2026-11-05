import logging
import math
from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from extensions import db

from models.cashier import Cashier
from models.customer import Customer
from models.order import Order, OrderItem
from models.product import Product
from models.notification import Notification
from models.stock_movement import StockMovement
from models.branch import Branch
from models.branch_product_stock import BranchProductStock

from admin_auth import admin_required
from plans import check_plan_limit
from tenancy import (
    business_is_open,
    resolve_shop_from_request,
    set_tenant,
)

from cashier_auth import (
    cashier_required,
    create_cashier_token,
)


logger = logging.getLogger(__name__)

cashier_bp = Blueprint(
    "cashier_bp",
    __name__,
    url_prefix="/api/cashier",
)


# ============================================================
# HELPER: NORMALIZE STATUS
# ============================================================

def normalize_status(value):
    """Normalize status values for consistent comparisons."""

    if not isinstance(value, str):
        return ""

    return (
        value.strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


# ============================================================
# HELPER: SERIALIZE ORDERS FOR CASHIER PAGES
# ============================================================

def serialize_cashier_order(order):
    """
    Serialize a shared order for cashier-facing pages.

    Excludes internal buying-cost and profit figures.
    Does not modify the database record.
    """

    order_data = order.to_dict()

    sanitized_items = []

    for item in order_data.get("items", []):
        item_data = dict(item)

        item_data.pop("buying_price", None)
        item_data.pop("cost_subtotal", None)
        item_data.pop("gross_profit", None)

        sanitized_items.append(item_data)

    order_data["items"] = sanitized_items

    return order_data


# ============================================================
# HELPER: SEARCH SHARED ORDERS
# ============================================================

def apply_order_search(
    query,
    search,
    include_delivery_fields=False,
):
    """
    Search orders by order number and available customer fields.

    Delivery searches additionally include delivery location,
    delivery person, and delivery phone.
    """

    search = search.strip()

    if not search:
        return query

    search_term = f"%{search}%"

    conditions = [
        Order.order_number.ilike(search_term),
    ]

    customer_conditions = []

    for field_name in ("name", "full_name", "email", "phone"):
        if hasattr(Customer, field_name):
            column = getattr(Customer, field_name)

            customer_conditions.append(
                column.ilike(search_term)
            )

    if customer_conditions:
        conditions.append(
            Order.customer.has(
                or_(*customer_conditions)
            )
        )

    if include_delivery_fields:
        conditions.extend([
            Order.delivery_location.ilike(search_term),
            Order.delivery_person.ilike(search_term),
            Order.delivery_phone.ilike(search_term),
        ])

    return query.filter(or_(*conditions))


# ============================================================
# HELPER: CREATE CUSTOMER NOTIFICATION
# ============================================================

def add_order_notification(
    order,
    notification_type,
    title,
    message,
):
    """
    Add a notification for an order update.

    The caller is responsible for committing the transaction.
    """

    db.session.add(
        Notification(
            customer_id=order.customer_id,
            type=notification_type,
            title=title,
            message=message,
            related_id=order.id,
        )
    )


# ============================================================
# HELPER: SERIALIZE STOCK MOVEMENT
# ============================================================

def serialize_stock_movement(movement):
    """Return a stock movement without exposing sensitive data."""

    return movement.to_dict()


# ============================================================
# HELPER: ACTIVE CASHIER BRANCH
# ============================================================

def get_active_cashier_branch(cashier):
    """
    Return the cashier's assigned active branch.

    A cashier without an active assigned branch must not
    access or modify branch inventory.
    """

    if cashier is None or not cashier.is_active:
        return None

    if cashier.branch_id is None:
        return None

    return db.session.execute(
        select(Branch).where(
            Branch.id == cashier.branch_id,
            Branch.is_active.is_(True),
        )
    ).scalar_one_or_none()


# ============================================================
# CASHIER LOGIN
# POST /api/cashier/login
# ============================================================

@cashier_bp.route("/login", methods=["POST"])
def cashier_login():
    data = request.get_json(silent=True) or {}

    username = data.get("username", "")
    password = data.get("password", "")

    if (
        not isinstance(username, str)
        or not isinstance(password, str)
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid login details.",
        }), 400

    username = username.strip()

    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password are required.",
        }), 400

    try:
        # Usernames are unique per business, so the shop is required.
        business = resolve_shop_from_request()

        if not business_is_open(business):
            return jsonify({
                "status": "error",
                "message": "Shop not found.",
            }), 404

        set_tenant(business.id)

        cashier = Cashier.query.filter(
            func.lower(Cashier.username) == username.lower()
        ).first()

        if (
            cashier is None
            or not cashier.is_active
            or not cashier.check_password(password)
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid username or password.",
            }), 401

        token = create_cashier_token(cashier)

        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "token": token,
            "cashier": cashier.to_dict(),
        }), 200

    except RuntimeError:
        logger.exception(
            "Cashier authentication configuration error."
        )

        return jsonify({
            "status": "error",
            "message": (
                "Cashier authentication is not configured."
            ),
        }), 500

    except Exception:
        db.session.rollback()

        logger.exception("Cashier login failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to process login right now.",
        }), 500


# ============================================================
# CURRENT CASHIER
# GET /api/cashier/me
# ============================================================

@cashier_bp.route("/me", methods=["GET"])
@cashier_required
def get_current_cashier():
    return jsonify({
        "status": "success",
        "cashier": g.cashier.to_dict(),
    }), 200


# ============================================================
# STOCK PRODUCTS
# GET /api/cashier/stock/products
# CASHIER AUTHENTICATION REQUIRED
# ============================================================

@cashier_bp.route("/stock/products", methods=["GET"])
@cashier_required
def get_stock_products():
    """
    Return active products assigned to the authenticated
    cashier's branch.

    Includes:
    - Actual product selling price.
    - Branch-specific stock quantity.
    - Portion-selling configuration.

    Never uses global Product.stock as branch stock.
    """

    try:
        cashier = db.session.get(Cashier, g.cashier.id)

        if cashier is None or not cashier.is_active:
            return jsonify({
                "status": "error",
                "message": (
                    "This cashier account is inactive or unavailable."
                ),
            }), 403

        branch = get_active_cashier_branch(cashier)

        if branch is None:
            return jsonify({
                "status": "error",
                "message": (
                    "Your cashier account has no active assigned branch. "
                    "Please ask an administrator to assign you to a branch."
                ),
            }), 403

        rows = db.session.execute(
            select(
                Product,
                BranchProductStock.quantity,
            )
            .join(
                BranchProductStock,
                BranchProductStock.product_id == Product.id,
            )
            .where(
                BranchProductStock.branch_id == branch.id,
                Product.is_active.is_(True),
            )
            .order_by(
                Product.name.asc(),
                Product.id.asc(),
            )
        ).all()

        products = []

        for product, branch_quantity in rows:
            products.append({
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "unit": product.unit,

                # Actual selling price per whole stock unit.
                "price": (
                    float(product.price)
                    if product.price is not None
                    else None
                ),

                # Portion-selling configuration.
                "allow_portion_sales": bool(
                    product.allow_portion_sales
                ),
                "portions_per_unit": (
                    product.portions_per_unit
                ),
                "portion_price": (
                    float(product.portion_price)
                    if product.portion_price is not None
                    else None
                ),

                # Branch-specific stock.
                # Do not substitute Product.stock here.
                "stock": branch_quantity,
                "branch_stock": branch_quantity,
                "stock_quantity": branch_quantity,

                "image": product.image,
            })

        return jsonify({
            "status": "success",
            "branch": {
                "id": branch.id,
                "name": branch.name,
                "code": branch.code,
            },
            "count": len(products),
            "products": products,
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Unable to retrieve branch stock products for cashier."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load branch inventory right now.",
        }), 500


# ============================================================
# ADD STOCK
# POST /api/cashier/stock/add
# ============================================================

@cashier_bp.route("/stock/add", methods=["POST"])
@cashier_required
def add_cashier_stock():
    """
    Add whole or fractional stock to the cashier's assigned branch.

    Supports up to three decimal places.
    Updates branch inventory and stock movement history
    within the same database transaction.
    """

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required.",
        }), 400

    product_id = data.get("product_id")
    raw_quantity = data.get("quantity")

    # --------------------------------------------------------
    # VALIDATE PRODUCT ID
    # --------------------------------------------------------

    if (
        isinstance(product_id, bool)
        or not isinstance(product_id, int)
        or product_id <= 0
    ):
        return jsonify({
            "status": "error",
            "message": "Select a valid product.",
        }), 400

    # --------------------------------------------------------
    # VALIDATE DECIMAL QUANTITY
    # --------------------------------------------------------

    if isinstance(raw_quantity, bool) or raw_quantity is None:
        return jsonify({
            "status": "error",
            "message": "Quantity must be a positive number.",
        }), 400

    try:
        if (
            isinstance(raw_quantity, float)
            and not math.isfinite(raw_quantity)
        ):
            raise InvalidOperation

        quantity = Decimal(str(raw_quantity))

        if not quantity.is_finite() or quantity <= Decimal("0"):
            raise InvalidOperation

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Quantity must be a valid positive number.",
        }), 400

    if quantity.as_tuple().exponent < -3:
        return jsonify({
            "status": "error",
            "message": "Quantity can have at most 3 decimal places.",
        }), 400

    if quantity > Decimal("1000000"):
        return jsonify({
            "status": "error",
            "message": "The quantity is too large.",
        }), 400

    # --------------------------------------------------------
    # VALIDATE REFERENCE AND NOTES
    # --------------------------------------------------------

    reference = data.get("reference", "")
    notes = data.get("notes", "")

    if reference is None:
        reference = ""

    if notes is None:
        notes = ""

    if not isinstance(reference, str) or not isinstance(notes, str):
        return jsonify({
            "status": "error",
            "message": "Reference and notes must be text.",
        }), 400

    reference = reference.strip()
    notes = notes.strip()

    if len(reference) > 150:
        return jsonify({
            "status": "error",
            "message": "Reference cannot exceed 150 characters.",
        }), 400

    if len(notes) > 5000:
        return jsonify({
            "status": "error",
            "message": "Notes cannot exceed 5000 characters.",
        }), 400

    # --------------------------------------------------------
    # UPDATE BRANCH INVENTORY
    # --------------------------------------------------------

    try:
        cashier = db.session.execute(
            select(Cashier)
            .where(Cashier.id == g.cashier.id)
            .with_for_update()
        ).scalar_one_or_none()

        if cashier is None or not cashier.is_active:
            db.session.rollback()

            return jsonify({
                "status": "error",
                "message": (
                    "This cashier account is inactive or unavailable."
                ),
            }), 403

        branch = get_active_cashier_branch(cashier)

        if branch is None:
            db.session.rollback()

            return jsonify({
                "status": "error",
                "message": (
                    "Your cashier account has no active assigned branch. "
                    "Please ask an administrator to assign you to a branch."
                ),
            }), 403

        product = db.session.execute(
            select(Product)
            .where(Product.id == product_id)
            .with_for_update()
        ).scalar_one_or_none()

        if product is None:
            db.session.rollback()

            return jsonify({
                "status": "error",
                "message": "Product not found.",
            }), 404

        if not product.is_active:
            db.session.rollback()

            return jsonify({
                "status": "error",
                "message": (
                    "This product is inactive and cannot be restocked."
                ),
            }), 409

        branch_stock = db.session.execute(
            select(BranchProductStock)
            .where(
                BranchProductStock.branch_id == branch.id,
                BranchProductStock.product_id == product.id,
            )
            .with_for_update()
        ).scalar_one_or_none()

        # Create a branch stock record if none exists.
        if branch_stock is None:
            branch_stock = BranchProductStock(
                branch_id=branch.id,
                product_id=product.id,
                quantity=Decimal("0.000"),
            )

            db.session.add(branch_stock)
            db.session.flush()

        # ----------------------------------------------------
        # CONVERT EXISTING STOCK TO DECIMAL
        # ----------------------------------------------------

        try:
            previous_stock = Decimal(str(branch_stock.quantity))

            if not previous_stock.is_finite() or previous_stock < 0:
                raise InvalidOperation

        except (InvalidOperation, ValueError, TypeError):
            invalid_value = branch_stock.quantity
            db.session.rollback()

            logger.error(
                "Invalid branch stock: branch_id=%s, "
                "product_id=%s, value=%r",
                branch.id,
                product.id,
                invalid_value,
            )

            return jsonify({
                "status": "error",
                "message": (
                    "The branch has an invalid stock value. "
                    "Please contact an administrator."
                ),
            }), 409

        # ----------------------------------------------------
        # CALCULATE NEW STOCK USING DECIMAL ARITHMETIC
        # ----------------------------------------------------

        new_stock = previous_stock + quantity

        if new_stock > Decimal("999999999.999"):
            db.session.rollback()

            return jsonify({
                "status": "error",
                "message": (
                    "This addition exceeds the supported stock limit."
                ),
            }), 400

        # All quantities remain Decimal values in the database.
        branch_stock.quantity = new_stock

        # ----------------------------------------------------
        # RECORD STOCK MOVEMENT
        # ----------------------------------------------------

        movement = StockMovement(
            cashier_id=cashier.id,
            product_id=product.id,
            branch_id=branch.id,
            product_name=product.name,
            previous_stock=previous_stock,
            quantity_added=quantity,
            new_stock=new_stock,
            reference=reference or None,
            notes=notes or None,
        )

        db.session.add(movement)
        db.session.flush()

        movement_data = serialize_stock_movement(movement)

        result = {
            "product": {
                "id": product.id,
                "name": product.name,
                "stock": float(new_stock),
                "unit": product.unit,
            },
            "branch": {
                "id": branch.id,
                "name": branch.name,
                "code": branch.code,
            },
            "movement": movement_data,
        }

        # Save the stock update and audit record together.
        db.session.commit()

        logger.info(
            "Cashier %s (ID %s) added %s units to product %s "
            "(ID %s), branch %s (ID %s).",
            cashier.username,
            cashier.id,
            quantity,
            product.name,
            product.id,
            branch.name,
            branch.id,
        )

        return jsonify({
            "status": "success",
            "message": (
                f"Added {quantity} {product.unit} "
                f"to {product.name} at {branch.name} successfully."
            ),
            **result,
        }), 201

    except IntegrityError:
        db.session.rollback()

        logger.exception(
            "Branch stock addition violated a database constraint."
        )

        return jsonify({
            "status": "error",
            "message": (
                "Stock could not be added because of a database "
                "constraint or a concurrent inventory update. "
                "Refresh the inventory and try again."
            ),
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception("Cashier branch stock addition failed.")

        return jsonify({
            "status": "error",
            "message": (
                "Unable to add stock right now. "
                "No changes have been committed."
            ),
        }), 500

# ============================================================
# CASHIER STOCK HISTORY
# GET /api/cashier/stock/history
# ============================================================

@cashier_bp.route("/stock/history", methods=["GET", "OPTIONS"])
@cashier_required
def get_cashier_stock_history():
    """
    Return paginated stock movements for the authenticated
    cashier's assigned active branch.

    Query parameters:
        limit  - Number of records per page (default 50, max 100)
        offset - Number of records to skip (default 0)
    """

    # --------------------------------------------------------
    # HANDLE PAGINATION
    # --------------------------------------------------------

    try:
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        if limit < 1:
            limit = 50

        limit = min(limit, 100)
        offset = max(offset, 0)

    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid pagination parameters.",
        }), 400

    try:
        # ----------------------------------------------------
        # AUTHENTICATED CASHIER
        # ----------------------------------------------------

        cashier = getattr(g, "cashier", None)

        if cashier is None:
            return jsonify({
                "status": "error",
                "message": "Cashier authentication is required.",
            }), 401

        # ----------------------------------------------------
        # VERIFY ASSIGNED ACTIVE BRANCH
        # ----------------------------------------------------

        branch = get_active_cashier_branch(cashier)

        if branch is None:
            return jsonify({
                "status": "error",
                "message": (
                    "Your account does not have an active "
                    "assigned branch. Please contact an administrator."
                ),
            }), 403

        # ----------------------------------------------------
        # FETCH THIS CASHIER'S STOCK MOVEMENTS
        # ----------------------------------------------------

        query = StockMovement.query.filter(
            StockMovement.cashier_id == cashier.id,
            StockMovement.branch_id == branch.id,
        )

        total = query.count()

        movements = (
            query
            .order_by(
                StockMovement.created_at.desc(),
                StockMovement.id.desc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        # ----------------------------------------------------
        # SERIALIZE DECIMAL QUANTITIES AND TIMESTAMPS
        # ----------------------------------------------------

        records = [
            serialize_stock_movement(movement)
            for movement in movements
        ]

        return jsonify({
            "status": "success",
            "history": records,
            "total": total,
            "limit": limit,
            "offset": offset,
        }), 200

    except Exception:
        logger.exception(
            "Failed to retrieve stock history for cashier ID %s.",
            getattr(g, "cashier", None).id
            if getattr(g, "cashier", None)
            else None,
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load stock history right now.",
        }), 500
# ============================================================
# SHARED ORDERS
# GET /api/cashier/orders
# ============================================================

@cashier_bp.route("/orders", methods=["GET"])
@cashier_required
def get_cashier_orders():
    """
    Return shared website orders and cashier POS sales.

    Optional query parameters:
        status
        payment_status
        search
    """

    try:
        query = Order.query

        status = request.args.get(
            "status",
            "",
        ).strip()

        if status and status.lower() != "all":
            query = query.filter(
                func.lower(Order.status) == status.lower()
            )

        payment_status = request.args.get(
            "payment_status",
            "",
        ).strip()

        if (
            payment_status
            and payment_status.lower() != "all"
        ):
            query = query.filter(
                func.lower(Order.payment_status)
                == payment_status.lower()
            )

        search = request.args.get(
            "search",
            "",
        ).strip()

        query = apply_order_search(
            query,
            search,
        )

        orders = query.order_by(
            Order.created_at.desc(),
            Order.id.desc(),
        ).all()

        return jsonify({
            "status": "success",
            "count": len(orders),
            "orders": [
                serialize_cashier_order(order)
                for order in orders
            ],
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Unable to retrieve shared orders for cashier."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load orders right now.",
        }), 500


# ============================================================
# UPDATE ORDER STATUS
# PUT /api/cashier/orders/<order_id>/status
# CASHIER AUTHENTICATION REQUIRED
# ============================================================

@cashier_bp.route(
    "/orders/<int:order_id>/status",
    methods=["PUT"],
)
@cashier_required
def update_cashier_order_status(order_id):
    """
    Update an order's operational status.

    Payment status cannot be changed through this endpoint.

    Cancelling an eligible unpaid order restores its stock.
    A paid order cannot be cancelled.
    A cancelled order cannot be reopened.
    """

    try:
        order = db.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found.",
            }), 404

        data = request.get_json(silent=True) or {}

        new_status = data.get("status")

        allowed_statuses = {
            "pending",
            "confirmed",
            "ready",
            "completed",
            "cancelled",
        }

        if (
            not isinstance(new_status, str)
            or new_status not in allowed_statuses
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "Invalid status. Allowed statuses: "
                    "pending, confirmed, ready, completed, cancelled."
                ),
            }), 400

        old_status = normalize_status(order.status)

        payment_status = normalize_status(
            order.payment_status
        )

        if (
            old_status in {"cancelled", "canceled"}
            and new_status != "cancelled"
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "A cancelled order cannot be reopened. "
                    "Create a new order if necessary."
                ),
            }), 400

        if old_status == new_status:
            return jsonify({
                "status": "success",
                "message": "Order status is already up to date.",
                "order": serialize_cashier_order(order),
            }), 200

        if new_status == "cancelled":

            if payment_status == "paid":
                return jsonify({
                    "status": "error",
                    "message": (
                        "This order is already paid. Resolve its "
                        "payment/refund before cancelling it."
                    ),
                }), 409

            order_items = OrderItem.query.filter_by(
                order_id=order.id
            ).order_by(
                OrderItem.id.asc()
            ).all()

            product_ids = sorted({
                item.product_id
                for item in order_items
            })

            products = (
                Product.query
                .filter(Product.id.in_(product_ids))
                .order_by(Product.id)
                .with_for_update()
                .all()
            ) if product_ids else []

            products_by_id = {
                product.id: product
                for product in products
            }

            for item in order_items:
                if item.product_id not in products_by_id:
                    db.session.rollback()

                    return jsonify({
                        "status": "error",
                        "message": (
                            "Stock could not be restored because "
                            "a product in this order no longer exists."
                        ),
                    }), 409

            for item in order_items:
                products_by_id[item.product_id].stock += (
                    item.quantity
                )

        order.status = new_status

        status_messages = {
            "pending": (
                "Order Status Updated",
                f"Your order {order.order_number} is now pending.",
            ),
            "confirmed": (
                "Order Confirmed",
                (
                    f"Good news! Your order {order.order_number} "
                    "has been confirmed."
                ),
            ),
            "ready": (
                "Order Ready",
                (
                    f"Your order {order.order_number} is ready. "
                    "Please check your order details for next steps."
                ),
            ),
            "completed": (
                "Order Completed",
                (
                    f"Your order {order.order_number} has been "
                    "marked as completed. Thank you for shopping "
                    "with us!"
                ),
            ),
            "cancelled": (
                "Order Cancelled",
                (
                    f"Your order {order.order_number} has been "
                    "cancelled and the ordered stock returned "
                    "to inventory."
                ),
            ),
        }

        title, message = status_messages[new_status]

        add_order_notification(
            order=order,
            notification_type="order_status",
            title=title,
            message=message,
        )

        db.session.flush()

        order_data = serialize_cashier_order(order)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Order cancelled and stock restored successfully."
                if new_status == "cancelled"
                else "Order status updated successfully."
            ),
            "order": order_data,
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Cashier failed to update order status for order ID %s.",
            order_id,
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to update order status. Please try again."
            ),
        }), 500


# ============================================================
# SHARED DELIVERIES
# GET /api/cashier/deliveries
# ============================================================

@cashier_bp.route("/deliveries", methods=["GET"])
@cashier_required
def get_cashier_deliveries():
    """
    Return delivery orders from the shared orders table.

    Optional query parameters:
        delivery_status
        payment_status
        search
    """

    try:
        query = Order.query.filter(
            func.lower(Order.order_type) == "delivery"
        )

        delivery_status = request.args.get(
            "delivery_status",
            "",
        ).strip()

        if (
            delivery_status
            and delivery_status.lower() != "all"
        ):
            query = query.filter(
                func.lower(Order.delivery_status)
                == delivery_status.lower()
            )

        payment_status = request.args.get(
            "payment_status",
            "",
        ).strip()

        if (
            payment_status
            and payment_status.lower() != "all"
        ):
            query = query.filter(
                func.lower(Order.payment_status)
                == payment_status.lower()
            )

        search = request.args.get(
            "search",
            "",
        ).strip()

        query = apply_order_search(
            query,
            search,
            include_delivery_fields=True,
        )

        deliveries = query.order_by(
            Order.created_at.desc(),
            Order.id.desc(),
        ).all()

        return jsonify({
            "status": "success",
            "count": len(deliveries),
            "deliveries": [
                serialize_cashier_order(order)
                for order in deliveries
            ],
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Unable to retrieve deliveries for cashier."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load deliveries right now.",
        }), 500


# ============================================================
# ASSIGN DELIVERY RIDER
# PUT /api/cashier/orders/<order_id>/delivery/assign
# CASHIER AUTHENTICATION REQUIRED
# ============================================================

@cashier_bp.route(
    "/orders/<int:order_id>/delivery/assign",
    methods=["PUT"],
)
@cashier_required
def assign_cashier_delivery_person(order_id):
    """
    Assign or update the delivery rider for a delivery order.

    Payment status is not modified by this endpoint.
    """

    try:
        # Lock the order so concurrent updates cannot overwrite
        # one another without first acquiring the row lock.
        order = db.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
        ).scalar_one_or_none()

        if order is None:
            return jsonify({
                "status": "error",
                "message": "Order not found.",
            }), 404

        if normalize_status(order.order_type) != "delivery":
            return jsonify({
                "status": "error",
                "message": "This order is not a delivery order.",
            }), 400

        if normalize_status(order.status) in {
            "cancelled",
            "canceled",
        }:
            return jsonify({
                "status": "error",
                "message": (
                    "A delivery rider cannot be assigned "
                    "to a cancelled order."
                ),
            }), 400

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "A valid JSON request body is required.",
            }), 400

        delivery_person = data.get("delivery_person")
        delivery_phone = data.get("delivery_phone")

        if (
            not isinstance(delivery_person, str)
            or not delivery_person.strip()
        ):
            return jsonify({
                "status": "error",
                "message": "The delivery person's name is required.",
            }), 400

        if (
            not isinstance(delivery_phone, str)
            or not delivery_phone.strip()
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "The delivery person's phone number is required."
                ),
            }), 400

        delivery_person = delivery_person.strip()
        delivery_phone = delivery_phone.strip()

        if len(delivery_person) > 120:
            return jsonify({
                "status": "error",
                "message": "The delivery person's name is too long.",
            }), 400

        if len(delivery_phone) > 30:
            return jsonify({
                "status": "error",
                "message": "The delivery phone number is too long.",
            }), 400

        order.delivery_person = delivery_person
        order.delivery_phone = delivery_phone

        # Automatically mark a previously pending delivery
        # as assigned. Preserve later delivery statuses.
        if normalize_status(order.delivery_status) == "pending":
            order.delivery_status = "assigned"

        # Keep notification creation inside the same transaction
        # as the rider assignment.
        if order.customer_id is not None:
            add_order_notification(
                order=order,
                notification_type="delivery",
                title="Delivery Person Assigned",
                message=(
                    f"A delivery person has been assigned "
                    f"to order {order.order_number}."
                ),
            )

        db.session.flush()

        order_data = serialize_cashier_order(order)

        db.session.commit()

        logger.info(
            "Cashier assigned delivery person to order ID %s.",
            order_id,
        )

        return jsonify({
            "status": "success",
            "message": "Delivery person assigned successfully.",
            "order": order_data,
        }), 200

    except IntegrityError:
        db.session.rollback()

        logger.exception(
            "Database constraint error while assigning "
            "delivery person to order ID %s.",
            order_id,
        )

        return jsonify({
            "status": "error",
            "message": "The delivery assignment could not be saved.",
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Cashier failed to assign delivery person "
            "to order ID %s.",
            order_id,
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to assign the delivery person. "
                "Please try again."
            ),
        }), 500


# ============================================================
# UPDATE DELIVERY STATUS
# PUT /api/cashier/orders/<order_id>/delivery/status
# CASHIER AUTHENTICATION REQUIRED
# ============================================================

@cashier_bp.route(
    "/orders/<int:order_id>/delivery/status",
    methods=["PUT"],
)
@cashier_required
def update_cashier_delivery_status(order_id):
    """
    Update delivery progress for a delivery order.

    Payment status is never changed here.
    Cancelled orders cannot have their delivery status changed.
    A delivery person must be assigned before dispatch,
    in-transit, or delivered statuses can be used.
    """

    try:
        order = db.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found.",
            }), 404

        if normalize_status(order.order_type) != "delivery":
            return jsonify({
                "status": "error",
                "message": "This order is not a delivery order.",
            }), 400

        if normalize_status(order.status) in {
            "cancelled",
            "canceled",
        }:
            return jsonify({
                "status": "error",
                "message": (
                    "Delivery status cannot be changed for "
                    "a cancelled order."
                ),
            }), 400

        data = request.get_json(silent=True) or {}

        new_status = data.get("delivery_status")

        allowed_statuses = {
            "pending",
            "assigned",
            "dispatched",
            "in_transit",
            "delivered",
            "failed",
        }

        if (
            not isinstance(new_status, str)
            or new_status not in allowed_statuses
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "Invalid delivery status. Allowed statuses: "
                    "pending, assigned, dispatched, in_transit, "
                    "delivered, failed."
                ),
            }), 400

        if (
            new_status in {
                "dispatched",
                "in_transit",
                "delivered",
            }
            and not (
                isinstance(order.delivery_person, str)
                and order.delivery_person.strip()
            )
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "Assign a delivery person before using "
                    "this delivery status."
                ),
            }), 400

        old_status = normalize_status(
            order.delivery_status
        )

        if old_status == new_status:
            return jsonify({
                "status": "success",
                "message": "Delivery status is already up to date.",
                "order": serialize_cashier_order(order),
            }), 200

        order.delivery_status = new_status

        delivery_messages = {
            "pending": "Your delivery is awaiting assignment.",
            "assigned": (
                "A delivery person has been assigned to your order."
            ),
            "dispatched": (
                "Your order has been dispatched for delivery."
            ),
            "in_transit": (
                "Your order is on its way to the delivery location."
            ),
            "delivered": (
                "Your order has been delivered. Thank you!"
            ),
            "failed": (
                "We could not complete your delivery. "
                "Please contact us for assistance."
            ),
        }

        add_order_notification(
            order=order,
            notification_type="delivery",
            title="Delivery Status Updated",
            message=(
                f"Order {order.order_number}: "
                f"{delivery_messages[new_status]}"
            ),
        )

        db.session.flush()

        order_data = serialize_cashier_order(order)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Delivery status updated successfully.",
            "order": order_data,
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Cashier failed to update delivery status "
            "for order ID %s.",
            order_id,
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to update delivery status. Please try again."
            ),
        }), 500


# ============================================================
# CREATE CASHIER — ADMIN ONLY
# POST /api/cashier/create
# ============================================================

@cashier_bp.route("/create", methods=["POST"])
@admin_required
def create_cashier():
    data = request.get_json(silent=True) or {}

    username = data.get("username")
    full_name = data.get("full_name")
    password = data.get("password")

    if not all(
        isinstance(value, str)
        for value in (username, full_name, password)
    ):
        return jsonify({
            "status": "error",
            "message": (
                "Username, full name and password are required."
            ),
        }), 400

    username = username.strip()
    full_name = full_name.strip()

    if not username or not full_name or not password:
        return jsonify({
            "status": "error",
            "message": "All fields are required.",
        }), 400

    if len(username) > 80:
        return jsonify({
            "status": "error",
            "message": "Username cannot exceed 80 characters.",
        }), 400

    if len(full_name) > 150:
        return jsonify({
            "status": "error",
            "message": "Full name cannot exceed 150 characters.",
        }), 400

    if len(password) < 12:
        return jsonify({
            "status": "error",
            "message": (
                "Password must contain at least 12 characters."
            ),
        }), 400

    try:
        existing_cashier = Cashier.query.filter(
            func.lower(Cashier.username) == username.lower()
        ).first()

        if existing_cashier:
            return jsonify({
                "status": "error",
                "message": "That username is already registered.",
            }), 409

        limit_message = check_plan_limit(
            g.business, Cashier, "max_cashiers"
        )

        if limit_message:
            return jsonify({
                "status": "error",
                "message": limit_message,
            }), 403

        cashier = Cashier(
            username=username,
            full_name=full_name,
        )

        cashier.set_password(password)

        db.session.add(cashier)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Cashier account created successfully.",
            "cashier": cashier.to_dict(),
        }), 201

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "That username is already registered.",
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception("Cashier account creation failed.")

        return jsonify({
            "status": "error",
            "message": "Unable to create cashier account.",
        }), 500
