import logging
import uuid
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from extensions import db
from customer_auth import identify_customer_from_token
from tenancy import shop_context_required
from models.customer import Customer
from models.product import Product
from models.order import Order, OrderItem
from models.notification import Notification


# ============================================================
# CONFIGURATION
# ============================================================

order_bp = Blueprint("order_bp", __name__)

logger = logging.getLogger(__name__)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def error_response(message, status_code):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code


def validate_quantity(value):
    """Accept positive whole-number quantities only."""

    if isinstance(value, bool):
        return None

    try:
        quantity = int(value)

        if quantity <= 0:
            return None

        if isinstance(value, float) and not value.is_integer():
            return None

        if (
            isinstance(value, str)
            and value.strip() != str(quantity)
        ):
            return None

        return quantity

    except (TypeError, ValueError, OverflowError):
        return None


def validate_order_total(value):
    """Convert a monetary amount to a finite Decimal."""

    try:
        amount = Decimal(str(value))

        if not amount.is_finite() or amount < 0:
            return None

        return amount

    except (
        InvalidOperation,
        ValueError,
        TypeError
    ):
        return None


# ============================================================
# CREATE CUSTOMER ORDER
# POST /api/orders
# ============================================================

@order_bp.route("/api/orders", methods=["POST"])
@shop_context_required
def create_order():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return error_response(
            "A valid JSON request is required.",
            400
        )

    customer_data = data.get("customer")
    items = data.get("items")

    # --------------------------------------------------------
    # VALIDATE REQUEST STRUCTURE
    # --------------------------------------------------------

    if not isinstance(customer_data, dict):
        return error_response(
            "Customer information is required.",
            400
        )

    if not isinstance(items, list) or not items:
        return error_response(
            "Order must contain at least one item.",
            400
        )

    if len(items) > 100:
        return error_response(
            "An order cannot contain more than 100 line items.",
            400
        )

    phone = customer_data.get("phone")
    customer_id = customer_data.get("id")

    if not isinstance(phone, str) or not phone.strip():
        return error_response(
            "Customer phone number is required.",
            400
        )

    phone = phone.strip()

    for field in ("name", "email"):
        value = customer_data.get(field)

        if value is not None and not isinstance(value, str):
            return error_response(
                f"Customer {field} must be a string.",
                400
            )

    order_type = data.get("order_type", "pickup")
    payment_method = data.get("payment_method", "cash")

    if order_type not in ("pickup", "delivery"):
        return error_response(
            "Invalid order type.",
            400
        )

    if payment_method not in ("cash", "mpesa"):
        return error_response(
            "Invalid payment method.",
            400
        )

    delivery_location = data.get("delivery_location")
    notes = data.get("notes")

    if (
        delivery_location is not None
        and not isinstance(delivery_location, str)
    ):
        return error_response(
            "Delivery location must be a string.",
            400
        )

    if notes is not None and not isinstance(notes, str):
        return error_response(
            "Order notes must be a string.",
            400
        )

    # Delivery requires a location.
    if (
        order_type == "delivery"
        and not (
            isinstance(delivery_location, str)
            and delivery_location.strip()
        )
    ):
        return error_response(
            "A delivery location is required for delivery orders.",
            400
        )

    try:

        # ----------------------------------------------------
        # FIND OR CREATE CUSTOMER
        # ----------------------------------------------------
        #
        # IMPORTANT:
        # A customer's checkout phone number is not required
        # to match their registered account phone.
        #
        # When a customer ID is provided, preserve the
        # existing account and its registered contact details.
        #
        # The entered phone number is used as checkout contact
        # information. M-Pesa uses the phone supplied separately
        # to the /api/payments/stk-push endpoint.
        # ----------------------------------------------------

        if customer_id is not None:

            if isinstance(customer_id, bool):
                return error_response(
                    "Invalid customer account ID.",
                    400
                )

            try:
                customer_id = int(customer_id)

                if customer_id <= 0:
                    raise ValueError

            except (
                TypeError,
                ValueError,
                OverflowError
            ):
                return error_response(
                    "Invalid customer account ID.",
                    400
                )

            # A customer id is only honoured for the logged-in
            # customer who owns it (and only within this shop).
            signed_in = identify_customer_from_token()

            if signed_in is None or signed_in.id != customer_id:
                db.session.rollback()

                return error_response(
                    "Please log in to order with your account.",
                    401
                )

            customer = signed_in

            # Do not compare customer.phone with the phone
            # entered at checkout.
            #
            # Do not overwrite the registered customer's
            # name, phone, or email during checkout.

        else:

            # Guest checkout:
            # Find an existing customer by the supplied phone.
            # If none exists, create a customer record.
            customer = Customer.query.filter_by(
                phone=phone
            ).first()

            if not customer:

                customer = Customer(
                    name=(
                        customer_data.get("name") or ""
                    ).strip(),
                    phone=phone,
                    email=(
                        customer_data.get("email") or ""
                    ).strip() or None
                )

                db.session.add(customer)
                db.session.flush()

        # ----------------------------------------------------
        # VALIDATE AND COMBINE ORDER ITEMS
        # ----------------------------------------------------

        requested_quantities = {}

        for item in items:

            if not isinstance(item, dict):
                db.session.rollback()

                return error_response(
                    "Each order item must be a valid object.",
                    400
                )

            product_id = item.get("product_id")

            if isinstance(product_id, bool):
                db.session.rollback()

                return error_response(
                    "Invalid product ID.",
                    400
                )

            try:
                product_id = int(product_id)

                if product_id <= 0:
                    raise ValueError

            except (
                TypeError,
                ValueError,
                OverflowError
            ):
                db.session.rollback()

                return error_response(
                    "Invalid product ID.",
                    400
                )

            quantity = validate_quantity(
                item.get("quantity")
            )

            if quantity is None:
                db.session.rollback()

                return error_response(
                    (
                        "Each item must have a positive "
                        "whole-number quantity."
                    ),
                    400
                )

            requested_quantities[product_id] = (
                requested_quantities.get(product_id, 0)
                + quantity
            )

        # ----------------------------------------------------
        # LOCK PRODUCTS AND CHECK STOCK
        # ----------------------------------------------------

        product_ids = sorted(
            requested_quantities.keys()
        )

        statement = (
            select(Product)
            .where(Product.id.in_(product_ids))
            .order_by(Product.id)
            .with_for_update()
        )

        products = db.session.execute(
            statement
        ).scalars().all()

        products_by_id = {
            product.id: product
            for product in products
        }

        if len(products_by_id) != len(product_ids):
            db.session.rollback()

            return error_response(
                "One or more products could not be found.",
                404
            )

        order_items = []
        total = Decimal("0.00")

        for product_id in product_ids:

            product = products_by_id[product_id]
            quantity = requested_quantities[product_id]

            if not product.is_active:
                product_name = product.name

                db.session.rollback()

                return error_response(
                    (
                        f"{product_name} is currently "
                        "unavailable."
                    ),
                    400
                )

            if product.stock < quantity:
                product_name = product.name
                available = product.stock

                db.session.rollback()

                return error_response(
                    (
                        f"Not enough stock for {product_name}. "
                        f"Available: {available}."
                    ),
                    400
                )

            price = validate_order_total(
                product.price
            )

            if price is None:
                db.session.rollback()

                logger.error(
                    "Invalid stored price for product ID %s.",
                    product.id
                )

                return error_response(
                    (
                        "A product has an invalid price. "
                        "Please contact support."
                    ),
                    500
                )

            subtotal = price * quantity
            total += subtotal

            order_items.append({
                "product": product,
                "quantity": quantity,
                "price": price
            })

        # ----------------------------------------------------
        # CREATE ORDER
        # ----------------------------------------------------

        order_number = (
            f"AG-{uuid.uuid4().hex[:8].upper()}"
        )

        order = Order(
            order_number=order_number,
            customer_id=customer.id,
            order_type=order_type,
            delivery_location=(
                delivery_location.strip()
                if delivery_location
                else None
            ),
            payment_method=payment_method,
            notes=notes.strip() if notes else None,
            total=total,
            status="pending"
        )

        db.session.add(order)
        db.session.flush()

        # ----------------------------------------------------
        # CREATE ORDER ITEMS AND DEDUCT STOCK
        # ----------------------------------------------------
        #
        # Preserve the current application's behaviour:
        # stock is reserved/deducted when an order is placed.
        # ----------------------------------------------------

        for item in order_items:

            product = item["product"]
            quantity = item["quantity"]

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price=item["price"]
            )

            db.session.add(order_item)

            product.stock -= quantity

        # ----------------------------------------------------
        # CREATE CUSTOMER NOTIFICATION
        # ----------------------------------------------------

        notification = Notification(
            customer_id=customer.id,
            type="order",
            title="Order Placed Successfully",
            message=(
                f"Your order {order.order_number} has been "
                f"placed successfully. Total: "
                f"KSh {total:.2f}. "
                f"Your order is currently pending."
            ),
            related_id=order.id
        )

        db.session.add(notification)

        # ----------------------------------------------------
        # COMMIT TRANSACTION
        # ----------------------------------------------------

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Order created successfully",
            "order": order.to_dict()
        }), 201

    except Exception:

        db.session.rollback()

        logger.exception(
            "Order creation failed."
        )

        return error_response(
            (
                "Unable to create the order right now. "
                "Please try again."
            ),
            500
        )
