import logging
from datetime import datetime, timedelta
from io import BytesIO
from decimal import Decimal, InvalidOperation
import uuid

from sqlalchemy import or_

from models.stock_transfer import (
    StockTransfer,
    StockTransferItem
)

from flask import Blueprint, jsonify, request, g, send_file
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

import math

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from extensions import db
from models.order import Order, OrderItem
from models.product import Product
from models.customer import Customer
from models.notification import Notification
from models.cash_collection import CashCollection
from models.stock_movement import StockMovement
from models.branch import Branch
from models.branch_product_stock import BranchProductStock
from models.cashier import Cashier
from models.cashier_sale import CashierSale, CashierSaleItem
from models.cashier_sale_payment import CashierSalePayment

from admin_auth import admin_required


admin_bp = Blueprint("admin_bp", __name__)
logger = logging.getLogger(__name__)


# ============================================================
# HELPER FUNCTIONS — REPORTS
# ============================================================

def parse_report_dates():
    """
    Read optional start_date and end_date query parameters.

    Expected format: YYYY-MM-DD.
    The end date is exclusive internally.
    """

    start_value = request.args.get("start_date")
    end_value = request.args.get("end_date")

    try:
        start_date = (
            datetime.strptime(start_value, "%Y-%m-%d")
            if start_value
            else None
        )

        end_date = (
            datetime.strptime(end_value, "%Y-%m-%d")
            + timedelta(days=1)
            if end_value
            else None
        )

    except ValueError as error:
        raise ValueError(
            "Invalid date format. Use YYYY-MM-DD."
        ) from error

    if start_date and end_date and start_date >= end_date:
        raise ValueError(
            "The start date must be on or before the end date."
        )

    return start_date, end_date


def get_filtered_orders(start_date=None, end_date=None):
    """Return orders within the optional date range."""

    query = Order.query

    if start_date:
        query = query.filter(Order.created_at >= start_date)

    if end_date:
        query = query.filter(Order.created_at < end_date)

    return query


def get_date_range():
    """Parse report date filters."""

    return parse_report_dates()


def money(value):
    """Convert numeric database values into JSON-friendly floats."""

    return float(value or Decimal("0.00"))


def quantity_number(value):
    """Serialize quantities while preserving fractional units."""
    quantity = Decimal(str(value or 0))
    if quantity == quantity.to_integral_value():
        return int(quantity)
    return float(quantity)


def get_order_amount(order):
    """Convert an order total into Decimal safely."""

    return Decimal(str(order.total or "0.00"))


def report_date_filters(start_date, end_date):
    """Return the selected date range in the API response."""

    return {
        "start_date": (
            start_date.date().isoformat()
            if start_date
            else None
        ),
        "end_date": (
            (end_date - timedelta(days=1)).date().isoformat()
            if end_date
            else None
        ),
    }


def normalize_status(value):
    """Normalize statuses for consistent comparisons."""

    if not isinstance(value, str):
        return ""

    return value.strip().lower().replace("-", "_").replace(" ", "_")


def calculate_margin(profit, revenue):
    """Calculate percentage margin safely."""

    if revenue <= Decimal("0.00"):
        return Decimal("0.00")

    return (profit / revenue) * Decimal("100")


# ============================================================
# PAYMENT HELPER FUNCTIONS
# ============================================================

def normalize_payment_value(value):
    """Normalize a payment-related value for comparisons."""

    if not isinstance(value, str):
        return ""

    return value.strip().lower().replace("-", "_").replace(" ", "_")


def is_electronic_payment_method(payment_method):
    """
    Identify payment methods that must not be manually confirmed
    without verified payment-provider confirmation.
    """

    method = normalize_payment_value(payment_method)

    electronic_methods = {
        "mpesa",
        "m_pesa",
        "stk",
        "stk_push",
        "mpesa_stk",
        "mpesa_stk_push",
        "paybill",
        "buy_goods",
        "card",
        "credit_card",
        "debit_card",
        "online",
        "online_payment",
        "bank_transfer",
        "digital_payment",
    }

    return method in electronic_methods


def get_manual_payment_eligibility(order):
    """
    Determine whether an order can be manually marked as paid.
    """

    payment_method = normalize_payment_value(
        order.payment_method
    )

    order_type = normalize_payment_value(
        order.order_type
    )

    if is_electronic_payment_method(payment_method):
        return False, (
            "Electronic payments must be verified through "
            "the payment provider before they can be marked paid."
        )

    is_cash_order = payment_method == "cash"

    is_pickup_order = order_type in {
        "pickup",
        "pick_up",
        "collection",
        "self_pickup",
    }

    if is_cash_order or is_pickup_order:
        return True, None

    return False, (
        "Only eligible cash or pickup orders can be "
        "manually marked as paid."
    )


# ============================================================
# GET ALL ORDERS — ADMIN ONLY
# GET /api/admin/orders
# ============================================================

@admin_bp.route("/api/admin/orders", methods=["GET"])
@admin_required
def get_orders():
    try:
        orders = Order.query.order_by(
            Order.created_at.desc()
        ).all()

        return jsonify([
            order.to_dict()
            for order in orders
        ]), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to retrieve orders.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve orders."
        }), 500


# ============================================================
# MARK ORDER AS PAID — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/orders/<int:order_id>/mark-paid",
    methods=["POST"]
)
@admin_bp.route(
    "/api/admin/orders/<int:order_id>/cash-payment",
    methods=["POST"]
)
@admin_required
def mark_order_as_paid(order_id):
    try:
        order = db.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        if normalize_payment_value(order.status) in {
            "cancelled",
            "canceled",
        }:
            return jsonify({
                "status": "error",
                "message": (
                    "Payment cannot be confirmed for a cancelled order."
                )
            }), 400

        eligible, eligibility_message = (
            get_manual_payment_eligibility(order)
        )

        if not eligible:
            return jsonify({
                "status": "error",
                "message": eligibility_message
            }), 400

        existing_collection = CashCollection.query.filter_by(
            order_id=order.id
        ).first()

        if (
            normalize_payment_value(order.payment_status) == "paid"
            or existing_collection is not None
        ):
            return jsonify({
                "status": "error",
                "message": "This order has already been paid."
            }), 409

        try:
            amount = get_order_amount(order)

        except (InvalidOperation, ValueError, TypeError):
            return jsonify({
                "status": "error",
                "message": "The order total is invalid."
            }), 400

        if not amount.is_finite() or amount <= Decimal("0.00"):
            return jsonify({
                "status": "error",
                "message": (
                    "The order total must be greater than zero."
                )
            }), 400

        admin_data = getattr(g, "admin", {}) or {}

        if not isinstance(admin_data, dict):
            return jsonify({
                "status": "error",
                "message": (
                    "The authenticated admin identity "
                    "could not be verified."
                )
            }), 401

        admin_username = admin_data.get("username")

        if (
            not isinstance(admin_username, str)
            or not admin_username.strip()
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "The authenticated admin identity "
                    "could not be verified."
                )
            }), 401

        admin_username = admin_username.strip()

        collection = CashCollection(
            order_id=order.id,
            amount=amount,
            method="cash",
            confirmed_by=admin_username,
            notes=(
                "Manual payment confirmed by admin for an "
                "eligible cash or pickup order."
            )
        )

        db.session.add(collection)
        order.payment_status = "paid"

        db.session.flush()

        collection_data = collection.to_dict()
        updated_order = order.to_dict()

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Payment confirmed successfully.",
            "order": updated_order,
            "order_id": order.id,
            "order_number": order.order_number,
            "payment_status": order.payment_status,
            "cash_collection": collection_data
        }), 200

    except IntegrityError:
        db.session.rollback()

        logger.warning(
            "Duplicate or conflicting payment confirmation "
            "attempt for order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": (
                "A payment record already exists for this order, "
                "or the payment could not be saved because of a "
                "database constraint."
            )
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Payment confirmation failed for order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to confirm payment right now. "
                "Please try again."
            )
        }), 500


# ============================================================
# UPDATE ORDER STATUS — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/orders/<int:order_id>/status",
    methods=["PUT"]
)
@admin_required
def update_order_status(order_id):
    try:
        order = (
            Order.query
            .filter_by(id=order_id)
            .with_for_update()
            .first()
        )

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        allowed_statuses = [
            "pending",
            "confirmed",
            "ready",
            "completed",
            "cancelled"
        ]

        if new_status not in allowed_statuses:
            return jsonify({
                "status": "error",
                "message": (
                    "Invalid status. Allowed statuses: "
                    + ", ".join(allowed_statuses)
                )
            }), 400

        old_status = order.status

        if old_status == "cancelled" and new_status != "cancelled":
            return jsonify({
                "status": "error",
                "message": (
                    "A cancelled order cannot be reopened. "
                    "Create a new order if necessary."
                )
            }), 400

        if old_status == new_status:
            return jsonify({
                "status": "success",
                "message": "Order status is already up to date.",
                "order": order.to_dict()
            }), 200

        if new_status == "cancelled":
            if normalize_payment_value(order.payment_status) == "paid":
                return jsonify({
                    "status": "error",
                    "message": (
                        "This order is already paid. Resolve its "
                        "payment/refund before cancelling it."
                    )
                }), 409

            order_items = OrderItem.query.filter_by(
                order_id=order.id
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
                        )
                    }), 409

            for item in order_items:
                products_by_id[item.product_id].stock += item.quantity

        order.status = new_status

        status_messages = {
            "pending": (
                "Order Status Updated",
                f"Your order {order.order_number} is now pending."
            ),
            "confirmed": (
                "Order Confirmed",
                f"Good news! Your order {order.order_number} has been confirmed."
            ),
            "ready": (
                "Order Ready",
                f"Your order {order.order_number} is ready. "
                "Please check your order details for next steps."
            ),
            "completed": (
                "Order Completed",
                f"Your order {order.order_number} has been marked as completed. "
                "Thank you for shopping with us!"
            ),
            "cancelled": (
                "Order Cancelled",
                f"Your order {order.order_number} has been cancelled "
                "and the ordered stock returned to inventory."
            )
        }

        title, message = status_messages[new_status]

        db.session.add(Notification(
            customer_id=order.customer_id,
            type="order_status",
            title=title,
            message=message,
            related_id=order.id
        ))

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Order cancelled and stock restored successfully."
                if new_status == "cancelled"
                else "Order status updated successfully."
            ),
            "order": order.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update order status for order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to update order status. Please try again."
            )
        }), 500


# ============================================================
# GET DELIVERY ORDERS — ADMIN ONLY
# ============================================================

@admin_bp.route("/api/admin/deliveries", methods=["GET"])
@admin_required
def get_deliveries():
    try:
        orders = Order.query.filter(
            Order.order_type == "delivery"
        ).order_by(
            Order.created_at.desc()
        ).all()

        return jsonify([
            order.to_dict()
            for order in orders
        ]), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to retrieve deliveries.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve deliveries."
        }), 500


# ============================================================
# ASSIGN DELIVERY PERSON — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/orders/<int:order_id>/delivery/assign",
    methods=["PUT"]
)
@admin_required
def assign_delivery_person(order_id):
    try:
        order = db.session.get(Order, order_id)

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        if order.order_type != "delivery":
            return jsonify({
                "status": "error",
                "message": "This order is not a delivery order."
            }), 400

        if normalize_status(order.status) in {"cancelled", "canceled"}:
            return jsonify({
                "status": "error",
                "message": "Cannot assign delivery for a cancelled order."
            }), 400

        data = request.get_json(silent=True) or {}

        delivery_person = data.get("delivery_person")
        delivery_phone = data.get("delivery_phone")

        if (
            not isinstance(delivery_person, str)
            or not delivery_person.strip()
        ):
            return jsonify({
                "status": "error",
                "message": "Delivery person's name is required."
            }), 400

        if (
            not isinstance(delivery_phone, str)
            or not delivery_phone.strip()
        ):
            return jsonify({
                "status": "error",
                "message": "Delivery person's phone number is required."
            }), 400

        order.delivery_person = delivery_person.strip()
        order.delivery_phone = delivery_phone.strip()

        if order.delivery_status == "pending":
            order.delivery_status = "assigned"

        db.session.add(Notification(
            customer_id=order.customer_id,
            type="delivery",
            title="Delivery Person Assigned",
            message=(
                f"A delivery person has been assigned to order "
                f"{order.order_number}."
            ),
            related_id=order.id
        ))

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Delivery person assigned successfully.",
            "order": order.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to assign delivery person to order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to assign delivery person."
        }), 500


# ============================================================
# UPDATE DELIVERY STATUS — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/orders/<int:order_id>/delivery/status",
    methods=["PUT"]
)
@admin_required
def update_delivery_status(order_id):
    try:
        order = db.session.get(Order, order_id)

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        if order.order_type != "delivery":
            return jsonify({
                "status": "error",
                "message": "This order is not a delivery order."
            }), 400

        if normalize_status(order.status) in {"cancelled", "canceled"}:
            return jsonify({
                "status": "error",
                "message": (
                    "Delivery status cannot be changed for a "
                    "cancelled order."
                )
            }), 400

        data = request.get_json(silent=True) or {}
        new_status = data.get("delivery_status")

        allowed_statuses = [
            "pending",
            "assigned",
            "dispatched",
            "in_transit",
            "delivered",
            "failed"
        ]

        if new_status not in allowed_statuses:
            return jsonify({
                "status": "error",
                "message": (
                    "Invalid delivery status. Allowed statuses: "
                    + ", ".join(allowed_statuses)
                )
            }), 400

        if (
            new_status in ("dispatched", "in_transit", "delivered")
            and not order.delivery_person
        ):
            return jsonify({
                "status": "error",
                "message": (
                    "Assign a delivery person before using "
                    "this delivery status."
                )
            }), 400

        old_status = order.delivery_status
        order.delivery_status = new_status

        delivery_messages = {
            "pending": "Your delivery is awaiting assignment.",
            "assigned": "A delivery person has been assigned to your order.",
            "dispatched": "Your order has been dispatched for delivery.",
            "in_transit": "Your order is on its way to the delivery location.",
            "delivered": "Your order has been delivered. Thank you!",
            "failed": (
                "We could not complete your delivery. "
                "Please contact us for assistance."
            )
        }

        if old_status != new_status:
            db.session.add(Notification(
                customer_id=order.customer_id,
                type="delivery",
                title="Delivery Status Updated",
                message=(
                    f"Order {order.order_number}: "
                    f"{delivery_messages[new_status]}"
                ),
                related_id=order.id
            ))

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Delivery status updated successfully.",
            "order": order.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update delivery status for order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update delivery status."
        }), 500


# ============================================================
# UPDATE DELIVERY NOTES — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/orders/<int:order_id>/delivery/notes",
    methods=["PUT"]
)
@admin_required
def update_delivery_notes(order_id):
    try:
        order = db.session.get(Order, order_id)

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        if order.order_type != "delivery":
            return jsonify({
                "status": "error",
                "message": "This order is not a delivery order."
            }), 400

        if normalize_status(order.status) in {"cancelled", "canceled"}:
            return jsonify({
                "status": "error",
                "message": (
                    "Delivery notes cannot be changed for a "
                    "cancelled order."
                )
            }), 400

        data = request.get_json(silent=True) or {}
        delivery_notes = data.get("delivery_notes")

        if (
            delivery_notes is not None
            and not isinstance(delivery_notes, str)
        ):
            return jsonify({
                "status": "error",
                "message": "Delivery notes must be text."
            }), 400

        order.delivery_notes = (
            delivery_notes.strip()
            if delivery_notes is not None
            else None
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Delivery notes updated successfully.",
            "order": order.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update delivery notes for order ID %s.",
            order_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update delivery notes."
        }), 500


# ============================================================
# GET ALL CUSTOMERS — ADMIN ONLY
# ============================================================

@admin_bp.route("/api/admin/customers", methods=["GET"])
@admin_required
def get_customers():
    try:
        customers = Customer.query.order_by(
            Customer.created_at.desc()
        ).all()

        return jsonify([
            customer.to_dict()
            for customer in customers
        ]), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to retrieve customers.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve customers."
        }), 500


# ============================================================
# REPORT 1: OVERVIEW — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/reports/overview",
    methods=["GET"]
)
@admin_required
def get_reports_overview():
    try:
        start_date, end_date = get_date_range()

        orders = get_filtered_orders(
            start_date, end_date
        ).all()

        status_counts = {
            "pending": 0,
            "confirmed": 0,
            "ready": 0,
            "completed": 0,
            "cancelled": 0
        }

        order_value = Decimal("0.00")
        completed_order_value = Decimal("0.00")

        for order in orders:
            status = normalize_status(order.status)

            status_counts[status] = (
                status_counts.get(status, 0) + 1
            )

            amount = get_order_amount(order)
            order_value += amount

            if status == "completed":
                completed_order_value += amount

        return jsonify({
            "status": "success",
            "filters": report_date_filters(
                start_date, end_date
            ),
            "overview": {
                "total_orders": len(orders),
                "total_order_value": money(order_value),
                "completed_orders": status_counts["completed"],
                "completed_order_value": money(
                    completed_order_value
                ),
                "total_customers": Customer.query.count(),
                "total_products": Product.query.count(),
                "status_counts": status_counts
            },
            "note": (
                "Order values are not verified payment revenue. "
                "Use the profit report for confirmed paid sales."
            )
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()
        logger.exception("Failed to generate overview report.")

        return jsonify({
            "status": "error",
            "message": "Unable to generate overview report."
        }), 500


# ============================================================
# REPORT 2: SALES BY DAY — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/reports/sales",
    methods=["GET"]
)
@admin_required
def get_sales_report():
    try:
        start_date, end_date = get_date_range()

        orders = get_filtered_orders(
            start_date, end_date
        ).order_by(Order.created_at.asc()).all()

        daily_sales = {}

        for order in orders:
            if not order.created_at:
                continue

            day = order.created_at.date().isoformat()

            if day not in daily_sales:
                daily_sales[day] = {
                    "date": day,
                    "orders": 0,
                    "order_value": Decimal("0.00"),
                    "completed_orders": 0,
                    "completed_order_value": Decimal("0.00")
                }

            amount = get_order_amount(order)

            daily_sales[day]["orders"] += 1
            daily_sales[day]["order_value"] += amount

            if normalize_status(order.status) == "completed":
                daily_sales[day]["completed_orders"] += 1
                daily_sales[day]["completed_order_value"] += amount

        results = []

        for day_data in daily_sales.values():
            results.append({
                "date": day_data["date"],
                "orders": day_data["orders"],
                "order_value": money(day_data["order_value"]),
                "completed_orders": day_data["completed_orders"],
                "completed_order_value": money(
                    day_data["completed_order_value"]
                )
            })

        return jsonify({
            "status": "success",
            "sales": results,
            "note": (
                "These figures represent order values, not "
                "verified payment revenue."
            )
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()
        logger.exception("Failed to generate sales report.")

        return jsonify({
            "status": "error",
            "message": "Unable to generate sales report."
        }), 500


# ============================================================
# REPORT 3: BEST-SELLING PRODUCTS — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/reports/products",
    methods=["GET"]
)
@admin_required
def get_product_report():
    try:
        start_date, end_date = get_date_range()

        query = db.session.query(
            OrderItem.product_id,
            func.sum(
                OrderItem.quantity
            ).label("quantity_sold"),
            func.sum(
                OrderItem.price * OrderItem.quantity
            ).label("item_value")
        ).join(
            Order,
            OrderItem.order_id == Order.id
        ).filter(
            func.lower(Order.status) != "cancelled"
        )

        if start_date:
            query = query.filter(
                Order.created_at >= start_date
            )

        if end_date:
            query = query.filter(
                Order.created_at < end_date
            )

        rows = query.group_by(
            OrderItem.product_id
        ).order_by(
            func.sum(OrderItem.quantity).desc()
        ).all()

        products = []

        for row in rows:
            product = db.session.get(
                Product, row.product_id
            )

            products.append({
                "product_id": row.product_id,
                "product_name": (
                    product.name
                    if product
                    else "Deleted product"
                ),
                "quantity_sold": int(row.quantity_sold or 0),
                "item_value": money(row.item_value)
            })

        return jsonify({
            "status": "success",
            "products": products,
            "total_products_sold": len(products),
            "total_quantity_sold": sum(
                item["quantity_sold"] for item in products
            ),
            "total_item_value": money(
                sum(
                    (
                        Decimal(str(item["item_value"]))
                        for item in products
                    ),
                    Decimal("0.00")
                )
            )
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()
        logger.exception("Failed to generate product report.")

        return jsonify({
            "status": "error",
            "message": "Unable to generate product report."
        }), 500


# ============================================================
# REPORT 4: DELIVERY STATISTICS — ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/api/admin/reports/deliveries",
    methods=["GET"]
)
@admin_required
def get_delivery_report():
    try:
        start_date, end_date = get_date_range()

        orders = get_filtered_orders(
            start_date, end_date
        ).filter(
            Order.order_type == "delivery"
        ).all()

        delivery_status_counts = {
            "pending": 0,
            "assigned": 0,
            "dispatched": 0,
            "in_transit": 0,
            "delivered": 0,
            "failed": 0
        }

        for order in orders:
            status = normalize_status(order.delivery_status)

            delivery_status_counts[status] = (
                delivery_status_counts.get(status, 0) + 1
            )

        return jsonify({
            "status": "success",
            "filters": report_date_filters(
                start_date, end_date
            ),
            "total_delivery_orders": len(orders),
            "delivery_status_counts": delivery_status_counts,
            "completed_deliveries": (
                delivery_status_counts["delivered"]
            ),
            "pending_deliveries": (
                delivery_status_counts["pending"]
            )
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()
        logger.exception("Failed to generate delivery report.")

        return jsonify({
            "status": "error",
            "message": "Unable to generate delivery report."
        }), 500


# ============================================================
# REPORT 5: PROFIT & ANALYTICS — ADMIN ONLY
#
# GET /api/admin/reports/profit
#
# Only confirmed paid orders are included.
# Cancelled orders are excluded.
#
# Historical item costs are read from OrderItem.buying_price.
# Missing costs are reported as unknown, not assumed to be zero.
# ============================================================

@admin_bp.route(
    "/api/admin/reports/profit",
    methods=["GET"]
)
@admin_required
def get_profit_report():
    try:
        start_date, end_date = get_date_range()

        # ----------------------------------------------------
        # SELECT CONFIRMED PAID ORDERS
        # ----------------------------------------------------

        orders_query = get_filtered_orders(
            start_date,
            end_date
        ).filter(
            func.lower(Order.payment_status) == "paid",
            func.lower(Order.status).notin_(
                ["cancelled", "canceled"]
            )
        ).order_by(
            Order.created_at.asc()
        )

        orders = orders_query.all()

        paid_order_ids = [
            order.id for order in orders
        ]

        # Totals use Decimal to avoid floating-point arithmetic
        # during financial calculations.
        sales_revenue = Decimal("0.00")
        cost_of_goods_sold = Decimal("0.00")
        known_cost_revenue = Decimal("0.00")
        unknown_cost_sales_value = Decimal("0.00")

        known_cost_item_count = 0
        unknown_cost_item_count = 0
        quantity_sold = 0

        product_totals = {}

        # ----------------------------------------------------
        # FETCH ORDER ITEMS
        # ----------------------------------------------------

        order_items = []

        if paid_order_ids:
            order_items = OrderItem.query.filter(
                OrderItem.order_id.in_(paid_order_ids)
            ).order_by(
                OrderItem.id.asc()
            ).all()

        for item in order_items:
            quantity = int(item.quantity or 0)

            if quantity <= 0:
                logger.warning(
                    "Skipping invalid quantity for OrderItem ID %s.",
                    item.id
                )
                continue

            try:
                selling_price = Decimal(
                    str(item.price)
                )

                if (
                    not selling_price.is_finite()
                    or selling_price < Decimal("0.00")
                ):
                    raise InvalidOperation

            except (InvalidOperation, ValueError, TypeError):
                logger.warning(
                    "Skipping invalid selling price for OrderItem ID %s.",
                    item.id
                )
                continue

            item_revenue = selling_price * quantity

            sales_revenue += item_revenue
            quantity_sold += quantity

            # Product identity is retained even if the product
            # has subsequently been deleted.
            product = db.session.get(
                Product,
                item.product_id
            )

            product_name = (
                product.name
                if product
                else "Deleted product"
            )

            if item.product_id not in product_totals:
                product_totals[item.product_id] = {
                    "product_id": item.product_id,
                    "product_name": product_name,
                    "quantity_sold": 0,
                    "sales_revenue": Decimal("0.00"),
                    "cost_of_goods_sold": Decimal("0.00"),
                    "gross_profit": Decimal("0.00"),
                    "known_cost_quantity": 0,
                    "unknown_cost_quantity": 0,
                    "unknown_cost_sales_value": Decimal("0.00")
                }

            product_data = product_totals[item.product_id]

            product_data["quantity_sold"] += quantity
            product_data["sales_revenue"] += item_revenue

            # IMPORTANT:
            # Use only the historical buying-price snapshot.
            # Never substitute today's product buying price.
            buying_price = getattr(
                item,
                "buying_price",
                None
            )

            if buying_price is None:
                unknown_cost_item_count += 1
                unknown_cost_sales_value += item_revenue

                product_data["unknown_cost_quantity"] += quantity
                product_data["unknown_cost_sales_value"] += item_revenue

                continue

            try:
                buying_price = Decimal(
                    str(buying_price)
                )

                if (
                    not buying_price.is_finite()
                    or buying_price < Decimal("0.00")
                ):
                    raise InvalidOperation

            except (InvalidOperation, ValueError, TypeError):
                unknown_cost_item_count += 1
                unknown_cost_sales_value += item_revenue

                product_data["unknown_cost_quantity"] += quantity
                product_data["unknown_cost_sales_value"] += item_revenue

                logger.warning(
                    "Invalid historical buying price for OrderItem ID %s.",
                    item.id
                )

                continue

            item_cost = buying_price * quantity
            item_profit = item_revenue - item_cost

            cost_of_goods_sold += item_cost
            known_cost_revenue += item_revenue
            known_cost_item_count += 1

            product_data["cost_of_goods_sold"] += item_cost
            product_data["gross_profit"] += item_profit
            product_data["known_cost_quantity"] += quantity

        # ----------------------------------------------------
        # OVERALL PROFIT
        # ----------------------------------------------------

        # This figure represents profit on items whose historical
        # costs are known. It is not a complete business-wide profit
        # figure when any included sales have unknown costs.
        gross_profit = (
            known_cost_revenue - cost_of_goods_sold
        )

        profit_margin = calculate_margin(
            gross_profit,
            known_cost_revenue
        )

        # ----------------------------------------------------
        # PRODUCT-LEVEL PROFITABILITY
        # ----------------------------------------------------

        product_results = []

        for product_data in product_totals.values():
            known_revenue = (
                product_data["sales_revenue"]
                - product_data["unknown_cost_sales_value"]
            )

            known_cost_quantity = product_data[
                "known_cost_quantity"
            ]

            unknown_cost_quantity = product_data[
                "unknown_cost_quantity"
            ]

            product_profit = product_data["gross_profit"]

            # If any units have unknown cost, explicitly flag the
            # product's profit as incomplete.
            cost_complete = unknown_cost_quantity == 0

            product_margin = calculate_margin(
                product_profit,
                known_revenue
            )

            product_results.append({
                "product_id": product_data["product_id"],
                "product_name": product_data["product_name"],
                "quantity_sold": product_data["quantity_sold"],
                "sales_revenue": money(
                    product_data["sales_revenue"]
                ),
                "item_value": money(
                    product_data["sales_revenue"]
                ),
                "cost_of_goods_sold": money(
                    product_data["cost_of_goods_sold"]
                ),
                "gross_profit": (
                    money(product_profit)
                    if known_cost_quantity > 0
                    else None
                ),
                "profit_margin": (
                    money(product_margin)
                    if known_revenue > Decimal("0.00")
                    and known_cost_quantity > 0
                    else None
                ),
                "cost_known": cost_complete,
                "unknown_cost": not cost_complete,
                "known_cost_quantity": known_cost_quantity,
                "unknown_cost_quantity": unknown_cost_quantity,
                "unknown_cost_sales_value": money(
                    product_data["unknown_cost_sales_value"]
                )
            })

        product_results.sort(
            key=lambda item: item["sales_revenue"],
            reverse=True
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({
            "status": "success",

            "filters": report_date_filters(
                start_date,
                end_date
            ),

            "profit": {
                "total_orders": len(orders),

                "sales_revenue": money(sales_revenue),
                "total_sales": money(sales_revenue),
                "revenue": money(sales_revenue),

                "cost_of_goods_sold": money(cost_of_goods_sold),
                "total_cost": money(cost_of_goods_sold),
                "cost": money(cost_of_goods_sold),

                "gross_profit": money(gross_profit),
                "total_profit": money(gross_profit),
                "profit": money(gross_profit),

                "profit_margin": money(profit_margin),
                "gross_profit_margin": money(profit_margin),
                "margin": money(profit_margin),

                "known_cost_revenue": money(known_cost_revenue),

                "unknown_cost_sales_value": money(
                    unknown_cost_sales_value
                ),

                "unknown_cost_revenue": money(
                    unknown_cost_sales_value
                ),

                "known_cost_item_count": known_cost_item_count,
                "unknown_cost_item_count": unknown_cost_item_count,

                "quantity_sold": quantity_sold,

                "products": product_results,
                "product_profit": product_results,
                "items": product_results,

                "profit_is_complete": (
                    unknown_cost_item_count == 0
                )
            },

            "note": (
                "This report includes confirmed paid orders and "
                "excludes cancelled orders. Gross profit and margin "
                "are calculated only for items with a valid recorded "
                "historical buying-price snapshot. Sales with unknown "
                "costs are reported separately. These figures do not "
                "include operating expenses, taxes, or other business "
                "costs and therefore are not net profit."
            )
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to generate profit report."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate profit report."
        }), 500

    # ============================================================
# STOCK HISTORY — ADMIN ONLY
#
# GET /api/admin/stock-history
#
# Returns stock additions made by all cashiers.
# Supports optional cashier and date filters.
# ============================================================

@admin_bp.route(
    "/api/admin/stock-history",
    methods=["GET"]
)
@admin_required
def get_admin_stock_history():
    try:
        # ----------------------------------------------------
        # OPTIONAL FILTERS
        # ----------------------------------------------------

        cashier_id = request.args.get("cashier_id", type=int)

        try:
            start_date, end_date = parse_report_dates()
        except ValueError as error:
            return jsonify({
                "status": "error",
                "message": str(error)
            }), 400

        # ----------------------------------------------------
        # BUILD QUERY
        # ----------------------------------------------------

        query = StockMovement.query

        if cashier_id is not None:
            if cashier_id <= 0:
                return jsonify({
                    "status": "error",
                    "message": "Invalid cashier ID."
                }), 400

            query = query.filter(
                StockMovement.cashier_id == cashier_id
            )

        if start_date:
            query = query.filter(
                StockMovement.created_at >= start_date
            )

        if end_date:
            query = query.filter(
                StockMovement.created_at < end_date
            )

        # ----------------------------------------------------
        # RETRIEVE NEWEST RECORDS FIRST
        # ----------------------------------------------------

        movements = query.order_by(
            StockMovement.created_at.desc(),
            StockMovement.id.desc()
        ).all()

        # ----------------------------------------------------
        # SERIALIZE RECORDS
        # ----------------------------------------------------

        records = [
            movement.to_dict()
            for movement in movements
        ]

        return jsonify(records), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve admin stock history."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve stock history."
        }), 500
   # ============================================================
# BRANCH MANAGEMENT
# ============================================================


# ------------------------------------------------------------
# GET ALL BRANCHES
# GET /api/admin/branches
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/branches",
    methods=["GET"]
)
@admin_required
def get_branches():
    try:
        branches = Branch.query.order_by(
            Branch.id.asc()
        ).all()

        cashier_counts = dict(
            db.session.query(
                Cashier.branch_id,
                func.count(Cashier.id)
            )
            .filter(
                Cashier.branch_id.isnot(None)
            )
            .group_by(
                Cashier.branch_id
            )
            .all()
        )

        return jsonify({
            "status": "success",
            "branches": [
                {
                    "id": branch.id,
                    "name": branch.name,
                    "code": branch.code,
                    "is_active": branch.is_active,
                    "cashier_count": cashier_counts.get(
                        branch.id,
                        0
                    ),
                }
                for branch in branches
            ],
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve branches."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve branches.",
        }), 500


# ------------------------------------------------------------
# GET BRANCH STOCK
# GET /api/admin/branches/<branch_id>/stock
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/branches/<int:branch_id>/stock",
    methods=["GET"]
)
@admin_required
def get_branch_stock_admin(branch_id):
    try:
        branch = db.session.get(
            Branch,
            branch_id
        )

        if branch is None:
            return jsonify({
                "status": "error",
                "message": "Branch not found.",
            }), 404

        records = (
            db.session.query(
                BranchProductStock,
                Product
            )
            .join(
                Product,
                Product.id == BranchProductStock.product_id
            )
            .filter(
                BranchProductStock.branch_id == branch_id
            )
            .order_by(
                Product.name.asc()
            )
            .all()
        )

        products = [
            {
                "id": product.id,
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "price": float(product.price or 0),
                "quantity": stock.quantity,
            }
            for stock, product in records
        ]

        return jsonify({
            "status": "success",
            "branch": {
                "id": branch.id,
                "name": branch.name,
                "code": branch.code,
            },

            # Support both response formats used by the frontend.
            "products": products,
            "stock": products,
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve stock for branch ID %s.",
            branch_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve branch stock.",
        }), 500


# ------------------------------------------------------------
# GET PRODUCTS AVAILABLE AS INTERBRANCH TRANSFER DESTINATIONS
# GET /api/admin/branches/<branch_id>/transfer-products
#
# Unlike the ordinary branch-stock endpoint, this includes every
# active catalog product. Products without a stock row are returned
# with quantity 0 so the admin can deliberately select them as the
# destination product for a transfer.
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/branches/<int:branch_id>/transfer-products",
    methods=["GET"]
)
@admin_required
def get_branch_transfer_products(branch_id):
    try:
        branch = db.session.get(Branch, branch_id)
        if branch is None:
            return jsonify({
                "status": "error",
                "message": "Branch not found."
            }), 404

        if not branch.is_active:
            return jsonify({
                "status": "error",
                "message": "The selected branch is inactive."
            }), 400

        rows = (
            db.session.query(Product, BranchProductStock.quantity)
            .outerjoin(
                BranchProductStock,
                (BranchProductStock.product_id == Product.id)
                & (BranchProductStock.branch_id == branch_id)
            )
            .filter(Product.is_active.is_(True))
            .order_by(Product.name.asc(), Product.id.asc())
            .all()
        )

        products = []
        for product, quantity in rows:
            products.append({
                "id": product.id,
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "price": float(product.price or 0),
                "quantity": float(quantity or 0),
                "branch_stock": float(quantity or 0),
                "has_stock_record": quantity is not None,
            })

        return jsonify({
            "status": "success",
            "branch": {
                "id": branch.id,
                "name": branch.name,
                "code": branch.code,
            },
            "products": products,
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception(
            "Failed to retrieve transfer destination products for branch ID %s.",
            branch_id
        )
        return jsonify({
            "status": "error",
            "message": "Unable to load destination products."
        }), 500


# ------------------------------------------------------------

# UPDATE BRANCH STOCK
# PUT /api/admin/branches/<branch_id>/stock/<product_id>
#
# Changes stock for the selected branch only.
# Does not change Product.stock.
# ------------------------------------------------------------


@admin_bp.route(
    "/api/admin/branches/<int:branch_id>/stock/<int:product_id>",
    methods=["PUT"]
)
@admin_required
def update_branch_stock_admin(
    branch_id,
    product_id
):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required.",
        }), 400

    raw_quantity = data.get("quantity")

    # Accept integer, decimal, and numeric string quantities.
    # Explicitly reject booleans, which Python treats as integers.
    if isinstance(raw_quantity, bool) or raw_quantity is None:
        return jsonify({
            "status": "error",
            "message": "Quantity must be a non-negative number.",
        }), 400

    try:
        if isinstance(raw_quantity, float):
            if not math.isfinite(raw_quantity):
                raise InvalidOperation

        quantity = Decimal(str(raw_quantity))

        if not quantity.is_finite() or quantity < 0:
            raise InvalidOperation

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Quantity must be a valid non-negative number.",
        }), 400

    # Match the stock precision used by the inventory system.
    if quantity.as_tuple().exponent < -3:
        return jsonify({
            "status": "error",
            "message": "Quantity can have at most 3 decimal places.",
        }), 400

    try:
        branch = db.session.get(
            Branch,
            branch_id
        )

        if branch is None:
            return jsonify({
                "status": "error",
                "message": "Branch not found.",
            }), 404

        product = db.session.get(
            Product,
            product_id
        )

        if product is None:
            return jsonify({
                "status": "error",
                "message": "Product not found.",
            }), 404

        if not branch.is_active:
            return jsonify({
                "status": "error",
                "message": "This branch is inactive.",
            }), 400

        stock = (
            BranchProductStock.query
            .filter_by(
                branch_id=branch_id,
                product_id=product_id
            )
            .with_for_update()
            .first()
        )

        if stock is None:
            stock = BranchProductStock(
                branch_id=branch_id,
                product_id=product_id,
                quantity=quantity,
            )

            db.session.add(stock)

        else:
            stock.quantity = quantity

        db.session.commit()

        saved_quantity = float(stock.quantity)

        return jsonify({
            "status": "success",
            "message": "Branch stock updated successfully.",
            "branch_id": branch_id,
            "product_id": product_id,
            "quantity": saved_quantity,
        }), 200

    except IntegrityError:
        db.session.rollback()

        logger.exception(
            "Stock update constraint failure: branch=%s product=%s",
            branch_id,
            product_id
        )

        return jsonify({
            "status": "error",
            "message": (
                "The stock update conflicted with a database "
                "constraint. Check the backend logs."
            ),
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to update branch stock: branch=%s product=%s",
            branch_id,
            product_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update branch stock.",
        }), 500


# ------------------------------------------------------------
# GET ALL CASHIERS
# GET /api/admin/cashiers
# ------------------------------------------------------------

@admin_bp.route("/api/admin/cashiers", methods=["GET"])
@admin_required
def get_all_cashiers():
    try:
        cashiers = Cashier.query.order_by(
            Cashier.username.asc()
        ).all()

        branch_names = {
            branch.id: branch.name
            for branch in Branch.query.all()
        }

        return jsonify({
            "status": "success",
            "cashiers": [
                {
                    "id": cashier.id,
                    "username": cashier.username,
                    "full_name": cashier.full_name,
                    "is_active": cashier.is_active,
                    "branch_id": cashier.branch_id,
                    "branch_name": branch_names.get(
                        cashier.branch_id
                    ),
                }
                for cashier in cashiers
            ],
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to retrieve cashiers.")

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve cashiers.",
        }), 500


# ------------------------------------------------------------
# GET CASHIERS FOR BRANCH MANAGEMENT
# GET /api/admin/branches/<branch_id>/cashiers
#
# Returns ALL cashiers, including those assigned to other
# branches or not assigned to any branch.
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/branches/<int:branch_id>/cashiers",
    methods=["GET"]
)
@admin_required
def get_branch_cashiers(branch_id):
    try:
        branch = db.session.get(
            Branch,
            branch_id
        )

        if branch is None:
            return jsonify({
                "status": "error",
                "message": "Branch not found.",
            }), 404

        cashiers = Cashier.query.order_by(
            Cashier.username.asc()
        ).all()

        branch_ids = {
            cashier.branch_id
            for cashier in cashiers
            if cashier.branch_id is not None
        }

        branches = Branch.query.filter(
            Branch.id.in_(branch_ids)
        ).all() if branch_ids else []

        branch_names = {
            item.id: item.name
            for item in branches
        }

        return jsonify({
            "status": "success",
            "branch": {
                "id": branch.id,
                "name": branch.name,
                "code": branch.code,
            },
            "cashiers": [
                {
                    "id": cashier.id,
                    "username": cashier.username,
                    "full_name": cashier.full_name,
                    "is_active": cashier.is_active,
                    "branch_id": cashier.branch_id,
                    "branch_name": branch_names.get(
                        cashier.branch_id
                    ),
                }
                for cashier in cashiers
            ],
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve cashiers for branch ID %s.",
            branch_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve branch cashiers.",
        }), 500


# ------------------------------------------------------------
# ASSIGN OR UNASSIGN CASHIER
# PUT /api/admin/cashiers/<cashier_id>/branch
#
# Assign:
# {"branch_id": 1}
#
# Unassign:
# {"branch_id": null}
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/cashiers/<int:cashier_id>/branch",
    methods=["PUT"]
)
@admin_required
def assign_cashier_branch(cashier_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON request body is required.",
        }), 400

    if "branch_id" not in data:
        return jsonify({
            "status": "error",
            "message": "The branch_id field is required.",
        }), 400

    branch_id = data["branch_id"]

    if branch_id is not None and (
        isinstance(branch_id, bool)
        or not isinstance(branch_id, int)
        or branch_id <= 0
    ):
        return jsonify({
            "status": "error",
            "message": (
                "branch_id must be a positive integer or null."
            ),
        }), 400

    try:
        cashier = db.session.execute(
            select(Cashier)
            .where(Cashier.id == cashier_id)
            .with_for_update()
        ).scalar_one_or_none()

        if cashier is None:
            return jsonify({
                "status": "error",
                "message": "Cashier not found.",
            }), 404

        if branch_id is None:
            cashier.branch_id = None

        else:
            branch = db.session.get(
                Branch,
                branch_id
            )

            if branch is None:
                return jsonify({
                    "status": "error",
                    "message": "Branch not found.",
                }), 404

            if not branch.is_active:
                return jsonify({
                    "status": "error",
                    "message": (
                        "Cannot assign a cashier to an inactive branch."
                    ),
                }), 400

            cashier.branch_id = branch.id

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": (
                "Cashier unassigned successfully."
                if cashier.branch_id is None
                else "Cashier assigned successfully."
            ),
            "cashier": {
                "id": cashier.id,
                "username": cashier.username,
                "branch_id": cashier.branch_id,
            },
        }), 200

    except IntegrityError:
        db.session.rollback()

        logger.exception(
            "Branch assignment constraint failure for cashier %s.",
            cashier_id
        )

        return jsonify({
            "status": "error",
            "message": "The cashier assignment could not be saved.",
        }), 409

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to assign cashier ID %s to a branch.",
            cashier_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update cashier assignment.",
        }), 500


# ------------------------------------------------------------
# GET POS SALES FOR A BRANCH
# GET /api/admin/branches/<branch_id>/sales
#
# Returns cashier POS sales only.
# Website customer orders remain separate.
# ------------------------------------------------------------

@admin_bp.route(
    "/api/admin/branches/<int:branch_id>/sales",
    methods=["GET"]
)
@admin_required
def get_branch_pos_sales(branch_id):
    try:
        branch = db.session.get(
            Branch,
            branch_id
        )

        if branch is None:
            return jsonify({
                "status": "error",
                "message": "Branch not found.",
            }), 404

        sales = (
            CashierSale.query
            .options(
                selectinload(CashierSale.items)
                    .selectinload(CashierSaleItem.product),
                selectinload(CashierSale.branch),
                selectinload(CashierSale.cashier),
            )
            .filter_by(
                branch_id=branch_id
            )
            .order_by(
                CashierSale.created_at.desc(),
                CashierSale.id.desc()
            )
            .limit(200)
            .all()
        )

        return jsonify({
            "status": "success",
            "branch_id": branch.id,
            "branch_name": branch.name,
            "sales": [
                sale.to_dict()
                for sale in sales
            ],
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve POS sales for branch ID %s.",
            branch_id
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve branch POS sales.",
        }), 500

# ============================================================
# POS REPORTING HELPERS
#
# POS sales remain separate from website customer orders.
# Revenue is included only for confirmed paid sales.
# Historical buying-price snapshots are used for COGS/profit.
# ============================================================

POS_SUCCESSFUL_PAYMENT_STATUSES = {
    "paid",
    "success",
    "successful",
    "completed",
}

POS_INACTIVE_SALE_STATUSES = {
    "voided",
    "void",
    "cancelled",
    "canceled",
}


def pos_payment_is_successful(payment):
    """Return True only for a confirmed successful payment."""

    if payment is None:
        return False

    return normalize_status(
        getattr(payment, "status", None)
    ) in POS_SUCCESSFUL_PAYMENT_STATUSES


def pos_sale_is_paid(sale):
    """
    Determine whether a POS sale has confirmed payment.

    A sale is paid if its payment_status is confirmed or at
    least one associated payment record has a successful status.

    Pending and failed payment records do not qualify.
    """

    if sale is None:
        return False

    if normalize_status(
        getattr(sale, "status", None)
    ) in POS_INACTIVE_SALE_STATUSES:
        return False

    if normalize_status(
        getattr(sale, "payment_status", None)
    ) in POS_SUCCESSFUL_PAYMENT_STATUSES:
        return True

    payments = getattr(sale, "payments", None) or []

    return any(
        pos_payment_is_successful(payment)
        for payment in payments
    )


def get_report_branch_id():
    """Read and validate the optional branch filter for POS reports."""

    raw_branch_id = request.args.get("branch_id")
    if raw_branch_id is None or not str(raw_branch_id).strip():
        return None

    try:
        branch_id = int(raw_branch_id)
    except (TypeError, ValueError):
        raise ValueError("Invalid branch ID.")

    if branch_id <= 0:
        raise ValueError("Invalid branch ID.")

    return branch_id


def get_filtered_pos_sales(start_date=None, end_date=None, branch_id=None):
    """Return POS sales filtered by date range and optional branch."""

    query = CashierSale.query.options(
        selectinload(CashierSale.payments),
        selectinload(CashierSale.branch),
        selectinload(CashierSale.cashier),
    )

    if start_date:
        query = query.filter(
            CashierSale.created_at >= start_date
        )

    if end_date:
        query = query.filter(
            CashierSale.created_at < end_date
        )

    if branch_id is not None:
        query = query.filter(
            CashierSale.branch_id == branch_id
        )

    return query


def get_confirmed_pos_sales(start_date=None, end_date=None, branch_id=None):
    """
    Return paid POS sales, excluding voided and cancelled sales.

    Payment records are retained for reconciliation, but they
    do not make an inactive sale count as active revenue.
    """

    sales = get_filtered_pos_sales(
        start_date,
        end_date,
        branch_id
    ).order_by(
        CashierSale.created_at.asc(),
        CashierSale.id.asc()
    ).all()

    return [
        sale
        for sale in sales
        if pos_sale_is_paid(sale)
    ]


def decimal_value(value, default="0.00"):
    """Convert a database value into a finite Decimal."""

    try:
        result = Decimal(
            str(value if value is not None else default)
        )

        if not result.is_finite():
            raise InvalidOperation

        return result

    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)


def get_pos_item_financials(item):
    """
    Calculate POS item financial values using Decimal quantities.

    item.quantity is the stock-equivalent quantity consumed.
    item.sale_quantity is the amount sold in the selected selling unit
    (for example, one portion). Price is per selling unit, while the
    historical buying price is per whole stock unit.

    Supports fractional quantities up to three decimal places.
    Missing historical buying-price snapshots remain unknown, not zero.
    """
    raw_stock_quantity = getattr(item, "quantity", None)
    raw_sale_quantity = getattr(item, "sale_quantity", None)

    if isinstance(raw_stock_quantity, bool) or raw_stock_quantity is None:
        return None

    if raw_sale_quantity is None:
        # Backward compatibility for older sale-item rows that predate
        # the separate selling-unit quantity field.
        raw_sale_quantity = raw_stock_quantity

    if isinstance(raw_sale_quantity, bool):
        return None

    try:
        stock_quantity = Decimal(str(raw_stock_quantity))
        sale_quantity = Decimal(str(raw_sale_quantity))

        if (
            not stock_quantity.is_finite()
            or stock_quantity <= Decimal("0")
            or stock_quantity.as_tuple().exponent < -3
            or not sale_quantity.is_finite()
            or sale_quantity <= Decimal("0")
            or sale_quantity.as_tuple().exponent < -3
        ):
            return None
    except (InvalidOperation, ValueError, TypeError):
        return None

    selling_price = decimal_value(
        getattr(item, "price", None),
        default="-1.00"
    )

    if selling_price < Decimal("0.00"):
        return None

    # Price is per selling unit; quantity is stock-equivalent amount.
    revenue = selling_price * sale_quantity

    raw_buying_price = getattr(item, "buying_price", None)

    if raw_buying_price is None:
        return {
            "quantity": stock_quantity,
            "stock_quantity": stock_quantity,
            "sale_quantity": sale_quantity,
            "selling_price": selling_price,
            "revenue": revenue,
            "buying_price": None,
            "cost": None,
            "profit": None,
        }

    buying_price = decimal_value(
        raw_buying_price,
        default="-1.00"
    )

    if buying_price < Decimal("0.00"):
        return {
            "quantity": stock_quantity,
            "stock_quantity": stock_quantity,
            "sale_quantity": sale_quantity,
            "selling_price": selling_price,
            "revenue": revenue,
            "buying_price": None,
            "cost": None,
            "profit": None,
        }

    cost = buying_price * stock_quantity

    return {
        "quantity": stock_quantity,
        "stock_quantity": stock_quantity,
        "sale_quantity": sale_quantity,
        "selling_price": selling_price,
        "revenue": revenue,
        "buying_price": buying_price,
        "cost": cost,
        "profit": revenue - cost,
    }


def get_pos_report_items(sales):
    """
    Retrieve items belonging to the supplied POS sales.

    This queries cashier_sale_items only. Website OrderItem
    records are never included.
    """

    sale_ids = [
        sale.id
        for sale in sales
    ]

    if not sale_ids:
        return []

    return CashierSaleItem.query.filter(
        CashierSaleItem.sale_id.in_(sale_ids)
    ).order_by(
        CashierSaleItem.id.asc()
    ).all()


def get_pos_sale_reference(sale):
    """Serialize a POS sale using sale_number, not order_number."""

    return {
        "id": sale.id,
        "sale_id": sale.id,
        "sale_number": sale.sale_number,
        "branch_id": sale.branch_id,
        "branch_name": (
            sale.branch.name
            if sale.branch
            else "Unknown branch"
        ),
        "cashier_id": sale.cashier_id,
        "cashier_name": (
            sale.cashier.full_name
            if sale.cashier
            else "Unknown cashier"
        ),
        "total": money(sale.total),
        "payment_method": sale.payment_method,
        "payment_status": sale.payment_status,
        "status": sale.status,
        "created_at": (
            sale.created_at.isoformat()
            if sale.created_at
            else None
        ),
    }


def get_pos_financial_summary(sales):
    """
    Calculate POS revenue and profitability.

    Revenue:
        Sale totals for confirmed paid, active POS sales.

    Cost and profit:
        Calculated only from items with valid historical
        buying-price snapshots.

    Missing costs are explicitly flagged.
    """

    sale_ids = {
        sale.id
        for sale in sales
    }

    summary = {
        "total_sales": len(sales),
        "sales_revenue": Decimal("0.00"),
        "cost_of_goods_sold": Decimal("0.00"),
        "gross_profit": Decimal("0.00"),
        "known_cost_revenue": Decimal("0.00"),
        "unknown_cost_sales_value": Decimal("0.00"),
        "quantity_sold": Decimal("0"),
        "stock_quantity_sold": Decimal("0"),
        "selling_quantity_sold": Decimal("0"),
        "known_cost_item_count": 0,
        "unknown_cost_item_count": 0,
        "known_cost_quantity": 0,
        "unknown_cost_quantity": 0,
        "profit_is_complete": True,
    }

    for sale in sales:
        summary["sales_revenue"] += decimal_value(
            sale.total
        )

    items = get_pos_report_items(sales)

    for item in items:
        if item.sale_id not in sale_ids:
            continue

        financials = get_pos_item_financials(item)

        if financials is None:
            logger.warning(
                "Skipping invalid POS sale item ID %s.",
                item.id
            )
            continue

        quantity = financials["quantity"]
        sale_quantity = financials["sale_quantity"]
        revenue = financials["revenue"]

        # Keep the legacy quantity_sold field as stock-equivalent quantity,
        # and expose the customer-facing selling-unit quantity separately.
        summary["quantity_sold"] += quantity
        summary["stock_quantity_sold"] += quantity
        summary["selling_quantity_sold"] += sale_quantity

        if financials["buying_price"] is None:
            summary["unknown_cost_item_count"] += 1
            summary["unknown_cost_quantity"] += quantity
            summary["unknown_cost_sales_value"] += revenue
            summary["profit_is_complete"] = False
            continue

        summary["known_cost_item_count"] += 1
        summary["known_cost_quantity"] += quantity

        summary["known_cost_revenue"] += revenue
        summary["cost_of_goods_sold"] += financials["cost"]
        summary["gross_profit"] += financials["profit"]

    summary["profit_margin"] = calculate_margin(
        summary["gross_profit"],
        summary["known_cost_revenue"]
    )

    summary["revenue"] = summary["sales_revenue"]
    summary["total_revenue"] = summary["sales_revenue"]
    summary["total_cost"] = summary["cost_of_goods_sold"]
    summary["total_profit"] = summary["gross_profit"]

    return summary


def serialize_pos_financial_summary(summary):
    """Convert financial summary values into JSON-safe numbers."""

    result = {}

    for key, value in summary.items():
        if isinstance(value, Decimal):
            result[key] = money(value)
        else:
            result[key] = value

    return result


# ============================================================
# POS REPORT 1: OVERVIEW
#
# GET /api/admin/reports/pos/overview
# ============================================================

@admin_bp.route(
    "/api/admin/reports/pos/overview",
    methods=["GET"]
)
@admin_required
def get_pos_reports_overview():
    try:
        start_date, end_date = get_date_range()
        selected_branch_id = get_report_branch_id()

        all_sales = get_filtered_pos_sales(
            start_date,
            end_date,
            selected_branch_id
        ).all()

        confirmed_sales = [
            sale
            for sale in all_sales
            if pos_sale_is_paid(sale)
        ]

        active_sales = [
            sale
            for sale in all_sales
            if normalize_status(sale.status)
            not in POS_INACTIVE_SALE_STATUSES
        ]

        pending_payment_count = sum(
            1
            for sale in active_sales
            if not pos_sale_is_paid(sale)
        )

        summary = get_pos_financial_summary(
            confirmed_sales
        )

        return jsonify({
            "status": "success",
            "filters": {
                **report_date_filters(start_date, end_date),
                "branch_id": selected_branch_id,
            },
            "overview": {
                **serialize_pos_financial_summary(summary),
                "total_transactions": len(all_sales),
                "paid_sales": len(confirmed_sales),
                "pending_payment_count": pending_payment_count,
                "voided_sales": sum(
                    1
                    for sale in all_sales
                    if normalize_status(sale.status)
                    in POS_INACTIVE_SALE_STATUSES
                ),
            },
            "note": (
                "POS reports use cashier POS records only. "
                "Confirmed revenue excludes pending and failed "
                "payments and excludes voided or cancelled sales. "
                "Profit uses recorded historical buying prices. "
                "Operating expenses and taxes are not deducted."
            ),
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to generate POS overview report."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate POS overview report.",
        }), 500


# ============================================================
# POS REPORT 2: SALES BY DAY AND TRANSACTIONS
#
# GET /api/admin/reports/pos/sales
# ============================================================

@admin_bp.route(
    "/api/admin/reports/pos/sales",
    methods=["GET"]
)
@admin_required
def get_pos_sales_report():
    try:
        start_date, end_date = get_date_range()
        selected_branch_id = get_report_branch_id()

        all_sales = get_filtered_pos_sales(
            start_date,
            end_date,
            selected_branch_id
        ).order_by(
            CashierSale.created_at.asc(),
            CashierSale.id.asc()
        ).all()

        confirmed_sales = [
            sale
            for sale in all_sales
            if pos_sale_is_paid(sale)
        ]

        daily_sales = {}

        for sale in confirmed_sales:
            if not sale.created_at:
                continue

            day = sale.created_at.date().isoformat()

            if day not in daily_sales:
                daily_sales[day] = {
                    "date": day,
                    "sales": 0,
                    "transactions": 0,
                    "sales_revenue": Decimal("0.00"),
                    "cost_of_goods_sold": Decimal("0.00"),
                    "gross_profit": Decimal("0.00"),
                    "known_cost_revenue": Decimal("0.00"),
                }

            daily_sales[day]["sales"] += 1
            daily_sales[day]["transactions"] += 1

            daily_sales[day]["sales_revenue"] += (
                decimal_value(sale.total)
            )

        items = get_pos_report_items(
            confirmed_sales
        )

        sales_by_id = {
            sale.id: sale
            for sale in confirmed_sales
        }

        for item in items:
            financials = get_pos_item_financials(item)

            if financials is None:
                continue

            sale = sales_by_id.get(item.sale_id)

            if sale is None or not sale.created_at:
                continue

            day = sale.created_at.date().isoformat()

            if financials["buying_price"] is None:
                continue

            daily_sales[day]["cost_of_goods_sold"] += (
                financials["cost"]
            )

            daily_sales[day]["gross_profit"] += (
                financials["profit"]
            )

            daily_sales[day]["known_cost_revenue"] += (
                financials["revenue"]
            )

        results = []

        for day, values in sorted(
            daily_sales.items()
        ):
            known_cost_revenue = values["known_cost_revenue"]

            results.append({
                "date": values["date"],
                "sales": values["sales"],
                "transactions": values["transactions"],
                "sales_revenue": money(
                    values["sales_revenue"]
                ),
                "revenue": money(
                    values["sales_revenue"]
                ),
                "total_sales": money(
                    values["sales_revenue"]
                ),
                "cost_of_goods_sold": money(
                    values["cost_of_goods_sold"]
                ),
                "gross_profit": money(
                    values["gross_profit"]
                ),
                "profit_margin": money(
                    calculate_margin(
                        values["gross_profit"],
                        known_cost_revenue
                    )
                ),
            })

        transaction_records = [
            get_pos_sale_reference(sale)
            for sale in reversed(confirmed_sales)
        ]

        return jsonify({
            "status": "success",
            "filters": {
                **report_date_filters(start_date, end_date),
                "branch_id": selected_branch_id,
            },
            "sales": results,
            "daily_sales": results,
            "transactions": transaction_records,
            "total_transactions": len(confirmed_sales),
            "total_sales_revenue": money(
                sum(
                    (
                        decimal_value(sale.total)
                        for sale in confirmed_sales
                    ),
                    Decimal("0.00")
                )
            ),
            "note": (
                "Transactions use sale_number. Only confirmed "
                "paid, active POS sales are included in these "
                "revenue figures."
            ),
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to generate POS sales report."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate POS sales report.",
        }), 500


# ============================================================
# POS REPORT 3: PRODUCT PERFORMANCE AND PROFITABILITY
#
# GET /api/admin/reports/pos/products
# ============================================================

@admin_bp.route(
    "/api/admin/reports/pos/products",
    methods=["GET"]
)
@admin_required
def get_pos_product_report():
    try:
        start_date, end_date = get_date_range()
        selected_branch_id = get_report_branch_id()

        sales = get_confirmed_pos_sales(
            start_date,
            end_date,
            selected_branch_id
        )

        sale_ids = {
            sale.id
            for sale in sales
        }

        products = {}

        for item in get_pos_report_items(sales):
            if item.sale_id not in sale_ids:
                continue

            financials = get_pos_item_financials(item)

            if financials is None:
                continue

            product_id = item.product_id

            if product_id not in products:
                product = db.session.get(
                    Product,
                    product_id
                )

                products[product_id] = {
                    "product_id": product_id,
                    "product_name": (
                        product.name
                        if product
                        else "Deleted product"
                    ),
                    "quantity_sold": Decimal("0"),
                    "stock_quantity_sold": Decimal("0"),
                    "sales_revenue": Decimal("0.00"),
                    "known_cost_revenue": Decimal("0.00"),
                    "cost_of_goods_sold": Decimal("0.00"),
                    "gross_profit": Decimal("0.00"),
                    "known_cost_quantity": 0,
                    "unknown_cost_quantity": 0,
                    "unknown_cost_sales_value": Decimal("0.00"),
                }

            row = products[product_id]

            row["quantity_sold"] += financials["sale_quantity"]
            row["stock_quantity_sold"] += financials["stock_quantity"]
            row["sales_revenue"] += financials["revenue"]

            if financials["buying_price"] is None:
                row["unknown_cost_quantity"] += (
                    financials["quantity"]
                )

                row["unknown_cost_sales_value"] += (
                    financials["revenue"]
                )

                continue

            row["known_cost_quantity"] += (
                financials["quantity"]
            )

            row["known_cost_revenue"] += (
                financials["revenue"]
            )

            row["cost_of_goods_sold"] += (
                financials["cost"]
            )

            row["gross_profit"] += (
                financials["profit"]
            )

        results = []

        for row in products.values():
            cost_complete = (
                row["unknown_cost_quantity"] == 0
            )

            results.append({
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "quantity_sold": quantity_number(row["quantity_sold"]),
                "stock_quantity_sold": quantity_number(
                    row["stock_quantity_sold"]
                ),
                "sales_revenue": money(
                    row["sales_revenue"]
                ),
                "item_value": money(
                    row["sales_revenue"]
                ),
                "cost_of_goods_sold": money(
                    row["cost_of_goods_sold"]
                ),
                "gross_profit": (
                    money(row["gross_profit"])
                    if row["known_cost_quantity"] > 0
                    else None
                ),
                "profit_margin": (
                    money(
                        calculate_margin(
                            row["gross_profit"],
                            row["known_cost_revenue"]
                        )
                    )
                    if row["known_cost_quantity"] > 0
                    else None
                ),
                "known_cost_revenue": money(
                    row["known_cost_revenue"]
                ),
                "unknown_cost_sales_value": money(
                    row["unknown_cost_sales_value"]
                ),
                "known_cost_quantity": quantity_number(row[
                    "known_cost_quantity"
                ]),
                "unknown_cost_quantity": quantity_number(row[
                    "unknown_cost_quantity"
                ]),
                "cost_known": cost_complete,
                "unknown_cost": not cost_complete,
            })

        results.sort(
            key=lambda row: row["sales_revenue"],
            reverse=True
        )

        summary = get_pos_financial_summary(sales)

        return jsonify({
            "status": "success",
            "filters": {
                **report_date_filters(start_date, end_date),
                "branch_id": selected_branch_id,
            },
            "products": results,
            "product_profit": results,
            "total_products_sold": len(results),
            "total_quantity_sold": quantity_number(sum(
                (Decimal(str(row["quantity_sold"])) for row in results),
                Decimal("0")
            )),
            "total_stock_quantity_sold": quantity_number(sum(
                (Decimal(str(row["stock_quantity_sold"])) for row in results),
                Decimal("0")
            )),
            "total_sales_revenue": money(
                sum(
                    (
                        Decimal(str(row["sales_revenue"]))
                        for row in results
                    ),
                    Decimal("0.00")
                )
            ),
            "profit_summary": serialize_pos_financial_summary(
                summary
            ),
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to generate POS product report."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate POS product report.",
        }), 500


# ============================================================
# POS REPORT 4: BRANCH PERFORMANCE AND PROFITABILITY
#
# GET /api/admin/reports/pos/branches
# ============================================================

@admin_bp.route(
    "/api/admin/reports/pos/branches",
    methods=["GET"]
)
@admin_required
def get_pos_branch_report():
    try:
        start_date, end_date = get_date_range()
        selected_branch_id = get_report_branch_id()

        sales = get_confirmed_pos_sales(
            start_date,
            end_date,
            selected_branch_id
        )

        branch_totals = {}

        for sale in sales:
            branch_id = sale.branch_id

            if branch_id not in branch_totals:
                branch = db.session.get(
                    Branch,
                    branch_id
                )

                branch_totals[branch_id] = {
                    "branch_id": branch_id,
                    "branch_name": (
                        branch.name
                        if branch
                        else "Unknown branch"
                    ),
                    "sales_count": 0,
                    "paid_sales": 0,
                    "sales_revenue": Decimal("0.00"),
                    "cost_of_goods_sold": Decimal("0.00"),
                    "gross_profit": Decimal("0.00"),
                    "known_cost_revenue": Decimal("0.00"),
                    "unknown_cost_sales_value": Decimal("0.00"),
                    "known_cost_item_count": 0,
                    "unknown_cost_item_count": 0,
                }

            row = branch_totals[branch_id]

            row["sales_count"] += 1
            row["paid_sales"] += 1

            row["sales_revenue"] += decimal_value(
                sale.total
            )

        sales_by_id = {
            sale.id: sale
            for sale in sales
        }

        for item in get_pos_report_items(sales):
            sale = sales_by_id.get(item.sale_id)

            if sale is None:
                continue

            financials = get_pos_item_financials(item)

            if financials is None:
                continue

            row = branch_totals.get(sale.branch_id)

            if row is None:
                continue

            if financials["buying_price"] is None:
                row["unknown_cost_item_count"] += 1

                row["unknown_cost_sales_value"] += (
                    financials["revenue"]
                )

                continue

            row["known_cost_item_count"] += 1

            row["known_cost_revenue"] += (
                financials["revenue"]
            )

            row["cost_of_goods_sold"] += (
                financials["cost"]
            )

            row["gross_profit"] += (
                financials["profit"]
            )

        results = []

        for row in branch_totals.values():
            cost_complete = (
                row["unknown_cost_item_count"] == 0
            )

            results.append({
                "branch_id": row["branch_id"],
                "branch_name": row["branch_name"],
                "sales_count": row["sales_count"],
                "total_sales": row["sales_count"],
                "paid_sales": row["paid_sales"],
                "sales_revenue": money(
                    row["sales_revenue"]
                ),
                "revenue": money(
                    row["sales_revenue"]
                ),
                "cost_of_goods_sold": money(
                    row["cost_of_goods_sold"]
                ),
                "gross_profit": (
                    money(row["gross_profit"])
                    if row["known_cost_item_count"] > 0
                    else None
                ),
                "profit_margin": (
                    money(
                        calculate_margin(
                            row["gross_profit"],
                            row["known_cost_revenue"]
                        )
                    )
                    if row["known_cost_revenue"] > 0
                    else None
                ),
                "known_cost_revenue": money(
                    row["known_cost_revenue"]
                ),
                "unknown_cost_sales_value": money(
                    row["unknown_cost_sales_value"]
                ),
                "known_cost_item_count": row[
                    "known_cost_item_count"
                ],
                "unknown_cost_item_count": row[
                    "unknown_cost_item_count"
                ],
                "cost_known": cost_complete,
                "unknown_cost": not cost_complete,
            })

        results.sort(
            key=lambda row: row["sales_revenue"],
            reverse=True
        )

        return jsonify({
            "status": "success",
            "filters": {
                **report_date_filters(start_date, end_date),
                "branch_id": selected_branch_id,
            },
            "branches": results,
            "branch_reports": results,
            "total_branches": len(results),
            "total_paid_sales": sum(
                row["paid_sales"]
                for row in results
            ),
            "total_sales_revenue": money(
                sum(
                    (
                        Decimal(str(row["sales_revenue"]))
                        for row in results
                    ),
                    Decimal("0.00")
                )
            ),
            "note": (
                "Branch profitability includes confirmed paid "
                "POS sales only. It uses historical item costs "
                "and excludes website orders. Profit is incomplete "
                "where historical buying prices are missing."
            ),
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to generate POS branch report."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate POS branch report.",
        }), 500    
    # ============================================================
# ALL POS SALES — ADMIN ONLY
#
# GET /api/admin/pos-sales
#
# Retrieves cashier POS transactions from CashierSale.
# Does NOT retrieve website Order records.
#
# Optional query parameters:
#   branch_id
#   start_date=YYYY-MM-DD
#   end_date=YYYY-MM-DD
# ============================================================

@admin_bp.route(
    "/api/admin/pos-sales",
    methods=["GET"]
)
@admin_required
def get_all_admin_pos_sales():
    try:
        query = CashierSale.query

        # ----------------------------------------------------
        # OPTIONAL BRANCH FILTER
        # ----------------------------------------------------

        branch_id = request.args.get(
            "branch_id",
            type=int
        )

        if branch_id is not None:
            if branch_id <= 0:
                return jsonify({
                    "status": "error",
                    "message": "Invalid branch ID."
                }), 400

            query = query.filter(
                CashierSale.branch_id == branch_id
            )

        # ----------------------------------------------------
        # OPTIONAL DATE FILTERS
        # ----------------------------------------------------

        try:
            start_date, end_date = parse_report_dates()

        except ValueError as error:
            return jsonify({
                "status": "error",
                "message": str(error)
            }), 400

        if start_date:
            query = query.filter(
                CashierSale.created_at >= start_date
            )

        if end_date:
            query = query.filter(
                CashierSale.created_at < end_date
            )

        # ----------------------------------------------------
        # NEWEST TRANSACTIONS FIRST
        # ----------------------------------------------------

        limit = request.args.get("limit", default=300, type=int)
        offset = request.args.get("offset", default=0, type=int)
        limit = max(1, min(limit, 1000))
        offset = max(0, offset)

        total = query.order_by(None).count()

        sales = (
            query
            .options(
                selectinload(CashierSale.items)
                    .selectinload(CashierSaleItem.product),
                selectinload(CashierSale.branch),
                selectinload(CashierSale.cashier),
            )
            .order_by(
                CashierSale.created_at.desc(),
                CashierSale.id.desc()
            )
            .limit(limit)
            .offset(offset)
            .all()
        )

        # ----------------------------------------------------
        # SERIALIZE POS SALES
        # ----------------------------------------------------

        return jsonify({
            "status": "success",
            "sales": [
                sale.to_dict()
                for sale in sales
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to retrieve all admin POS sales."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve POS sales."
        }), 500

# ============================================================
# EXPORT ALL POS REPORTS TO EXCEL — ADMIN ONLY
#
# GET /api/admin/reports/pos/export.xlsx
# Optional query parameters:
#   start_date=YYYY-MM-DD
#   end_date=YYYY-MM-DD
#   branch_id=<integer>
#
# Cashier POS records only. Website orders are excluded.
# ============================================================

@admin_bp.route(
    "/api/admin/reports/pos/export.xlsx",
    methods=["GET"]
)
@admin_required
def export_all_pos_reports_excel():
    try:
        from datetime import datetime, date, time

        start_date, end_date = parse_report_dates()

        branch_id = request.args.get("branch_id", type=int)
        if branch_id is not None and branch_id <= 0:
            return jsonify({
                "status": "error",
                "message": "Invalid branch ID.",
            }), 400

        # ----------------------------------------------------
        # FETCH POS SALES
        # ----------------------------------------------------

        sales_query = get_filtered_pos_sales(start_date, end_date)

        if branch_id is not None:
            sales_query = sales_query.filter(
                CashierSale.branch_id == branch_id
            )

        all_sales = sales_query.order_by(
            CashierSale.created_at.asc(),
            CashierSale.id.asc()
        ).all()

        all_sale_ids = [sale.id for sale in all_sales]

        items = get_pos_report_items(all_sales)

        paid_sales = [
            sale for sale in all_sales
            if pos_sale_is_paid(sale)
        ]

        paid_sale_ids = {sale.id for sale in paid_sales}

        void_sales = [
            sale for sale in all_sales
            if normalize_status(getattr(sale, "status", None))
            in POS_INACTIVE_SALE_STATUSES
        ]

        # ----------------------------------------------------
        # FETCH PAYMENTS
        # ----------------------------------------------------

        payments = []

        if all_sale_ids:
            payments = CashierSalePayment.query.filter(
                CashierSalePayment.sale_id.in_(all_sale_ids)
            ).order_by(
                CashierSalePayment.id.asc()
            ).all()

        # ----------------------------------------------------
        # FETCH RELATED PRODUCTS
        # ----------------------------------------------------

        product_ids = {
            getattr(item, "product_id", None)
            for item in items
            if getattr(item, "product_id", None) is not None
        }

        product_map = {}

        if product_ids:
            product_map = {
                product.id: product
                for product in Product.query.filter(
                    Product.id.in_(product_ids)
                ).all()
            }

        # ----------------------------------------------------
        # FETCH BRANCHES
        # ----------------------------------------------------

        branch_ids = {
            getattr(sale, "branch_id", None)
            for sale in all_sales
            if getattr(sale, "branch_id", None) is not None
        }

        branch_map = {}

        if branch_ids:
            branch_map = {
                branch.id: branch
                for branch in Branch.query.filter(
                    Branch.id.in_(branch_ids)
                ).all()
            }

        # ----------------------------------------------------
        # FETCH CASHIERS
        # ----------------------------------------------------

        cashier_ids = {
            getattr(sale, "cashier_id", None)
            for sale in all_sales
            if getattr(sale, "cashier_id", None) is not None
        }

        cashier_map = {}

        if cashier_ids:
            cashier_map = {
                cashier.id: cashier
                for cashier in Cashier.query.filter(
                    Cashier.id.in_(cashier_ids)
                ).all()
            }

        # ----------------------------------------------------
        # CREATE WORKBOOK
        # ----------------------------------------------------

        workbook = Workbook()

        summary_ws = workbook.active
        summary_ws.title = "Sales Summary"

        sales_ws = workbook.create_sheet("Sales Records")
        items_ws = workbook.create_sheet("Sale Items")
        payments_ws = workbook.create_sheet("Payments")
        branch_ws = workbook.create_sheet("Branch Performance")
        product_ws = workbook.create_sheet("Product Performance")
        void_ws = workbook.create_sheet("Voided Sales")

        title_fill = PatternFill("solid", fgColor="17365D")
        title_font = Font(color="FFFFFF", bold=True)

        header_fill = PatternFill("solid", fgColor="D9EAF7")
        header_font = Font(bold=True, color="17365D")

        # ----------------------------------------------------
        # EXCEL-SAFE VALUE CONVERSION
        # ----------------------------------------------------

        def make_excel_safe(value):
            """
            Convert timezone-aware date/time values into values
            Excel supports. This does not modify database values.
            """

            if isinstance(value, datetime):
                if value.tzinfo is not None:
                    return value.replace(tzinfo=None)
                return value

            if isinstance(value, time):
                if value.tzinfo is not None:
                    return value.replace(tzinfo=None)
                return value

            if isinstance(value, date):
                return value

            if isinstance(value, Decimal):
                return float(value)

            return value

        def safe_datetime(value):
            if value is None:
                return None

            if isinstance(value, (datetime, date)):
                return make_excel_safe(value)

            return str(value)

        # ----------------------------------------------------
        # WRITE TABLES
        # ----------------------------------------------------

        def write_table(ws, headers, rows):
            ws.append(headers)

            for cell in ws[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")

            for row in rows:
                # Apply conversion to EVERY cell in EVERY sheet.
                ws.append([
                    make_excel_safe(value)
                    for value in row
                ])

            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions

            for column_cells in ws.columns:
                max_length = 0
                column_letter = get_column_letter(
                    column_cells[0].column
                )

                for cell in column_cells[:5000]:
                    value = cell.value

                    if value is not None:
                        max_length = max(
                            max_length,
                            len(str(value))
                        )

                ws.column_dimensions[column_letter].width = min(
                    max(max_length + 2, 12),
                    36
                )

        # ----------------------------------------------------
        # BRANCH AND CASHIER HELPERS
        # ----------------------------------------------------

        def branch_name(sale):
            branch = branch_map.get(
                getattr(sale, "branch_id", None)
            )

            return (
                getattr(branch, "name", None)
                or "Unknown branch"
            )

        def cashier_name(sale):
            cashier = cashier_map.get(
                getattr(sale, "cashier_id", None)
            )

            return (
                getattr(cashier, "full_name", None)
                or getattr(cashier, "username", None)
                or "Unknown cashier"
            )

        # ----------------------------------------------------
        # SALES RECORDS
        # ----------------------------------------------------

        sale_rows = []

        for sale in all_sales:
            sale_rows.append([
                getattr(sale, "id", None),
                getattr(sale, "sale_number", None),
                safe_datetime(
                    getattr(sale, "created_at", None)
                ),
                getattr(sale, "branch_id", None),
                branch_name(sale),
                getattr(sale, "cashier_id", None),
                cashier_name(sale),
                getattr(sale, "customer_name", None),
                getattr(sale, "subtotal", None),
                getattr(sale, "discount", None),
                getattr(sale, "total", None),
                getattr(sale, "payment_method", None),
                getattr(sale, "payment_status", None),
                getattr(sale, "status", None),
                "Yes" if sale.id in paid_sale_ids else "No",
            ])

        write_table(
            sales_ws,
            [
                "Sale ID",
                "Sale Number",
                "Date/Time",
                "Branch ID",
                "Branch",
                "Cashier ID",
                "Cashier",
                "Customer",
                "Subtotal",
                "Discount",
                "Sale Total",
                "Payment Method",
                "Payment Status",
                "Sale Status",
                "Counts as Confirmed Paid Sale",
            ],
            sale_rows
        )

        # ----------------------------------------------------
        # SALE ITEMS AND PRODUCT PERFORMANCE TOTALS
        # ----------------------------------------------------

        item_rows = []
        product_totals = {}
        branch_totals = {}

        sales_by_id = {
            sale.id: sale
            for sale in all_sales
        }

        for item in items:
            sale = sales_by_id.get(
                getattr(item, "sale_id", None)
            )

            financials = get_pos_item_financials(item)

            product = product_map.get(
                getattr(item, "product_id", None)
            )

            product_name = (
                getattr(product, "name", None)
                or "Deleted product"
            )

            stock_qty = (
                financials["stock_quantity"]
                if financials
                else decimal_value(
                    getattr(item, "quantity", 0),
                    "0"
                )
            )

            sale_qty = (
                financials["sale_quantity"]
                if financials
                else decimal_value(
                    getattr(
                        item,
                        "sale_quantity",
                        getattr(item, "quantity", 0)
                    ),
                    "0"
                )
            )

            unit_price = (
                financials["selling_price"]
                if financials
                else decimal_value(
                    getattr(item, "price", 0),
                    "0"
                )
            )

            revenue = (
                financials["revenue"]
                if financials
                else Decimal("0.00")
            )

            buying_price = (
                financials["buying_price"]
                if financials
                else None
            )

            cost = (
                financials["cost"]
                if financials
                else None
            )

            profit = (
                financials["profit"]
                if financials
                else None
            )

            item_rows.append([
                getattr(item, "id", None),
                getattr(item, "sale_id", None),
                getattr(sale, "sale_number", None)
                if sale else None,
                safe_datetime(
                    getattr(sale, "created_at", None)
                ) if sale else None,
                branch_name(sale) if sale else "Unknown branch",
                getattr(item, "product_id", None),
                product_name,
                float(stock_qty),
                float(sale_qty),
                float(unit_price),
                float(buying_price)
                if buying_price is not None else None,
                float(revenue),
                float(cost) if cost is not None else None,
                float(profit) if profit is not None else None,
                "Known" if buying_price is not None else "Unknown",
                "Yes" if sale and sale.id in paid_sale_ids else "No",
            ])

            if sale and sale.id in paid_sale_ids and financials:
                key = getattr(item, "product_id", None)

                if key not in product_totals:
                    product_totals[key] = {
                        "name": product_name,
                        "stock_qty": Decimal("0"),
                        "sale_qty": Decimal("0"),
                        "revenue": Decimal("0.00"),
                        "cost": Decimal("0.00"),
                        "profit": Decimal("0.00"),
                        "unknown_cost_revenue": Decimal("0.00"),
                    }

                totals = product_totals[key]

                totals["stock_qty"] += financials["stock_quantity"]
                totals["sale_qty"] += financials["sale_quantity"]
                totals["revenue"] += financials["revenue"]

                if financials["cost"] is None:
                    totals["unknown_cost_revenue"] += (
                        financials["revenue"]
                    )
                else:
                    totals["cost"] += financials["cost"]
                    totals["profit"] += financials["profit"]

        write_table(
            items_ws,
            [
                "Item ID",
                "Sale ID",
                "Sale Number",
                "Sale Date/Time",
                "Branch",
                "Product ID",
                "Product",
                "Stock Quantity (3 d.p.)",
                "Selling Quantity (3 d.p.)",
                "Selling Unit Price",
                "Historical Buying Price",
                "Line Revenue",
                "Cost of Goods Sold",
                "Gross Profit",
                "Cost Data",
                "Confirmed Paid Sale",
            ],
            item_rows
        )

        # ----------------------------------------------------
        # PAYMENT RECORDS
        # ----------------------------------------------------

        payment_rows = []

        for payment in payments:
            sale = sales_by_id.get(
                getattr(payment, "sale_id", None)
            )

            payment_rows.append([
                getattr(payment, "id", None),
                getattr(payment, "sale_id", None),
                getattr(sale, "sale_number", None)
                if sale else None,
                safe_datetime(
                    getattr(
                        payment,
                        "created_at",
                        getattr(payment, "paid_at", None)
                    )
                ),
                getattr(
                    payment,
                    "method",
                    getattr(payment, "payment_method", None)
                ),
                getattr(payment, "amount", None),
                getattr(payment, "status", None),
                getattr(
                    payment,
                    "transaction_reference",
                    getattr(payment, "reference", None)
                ),
                getattr(payment, "notes", None),
            ])

        write_table(
            payments_ws,
            [
                "Payment ID",
                "Sale ID",
                "Sale Number",
                "Payment Date/Time",
                "Payment Method",
                "Amount",
                "Payment Status",
                "Transaction Reference",
                "Notes",
            ],
            payment_rows
        )

        # ----------------------------------------------------
        # SUMMARY METRICS
        # ----------------------------------------------------

        total_revenue = sum(
            (
                decimal_value(sale.total)
                for sale in paid_sales
            ),
            Decimal("0.00")
        )

        total_discounts = sum(
            (
                decimal_value(
                    getattr(sale, "discount", 0)
                )
                for sale in paid_sales
            ),
            Decimal("0.00")
        )

        item_cost = Decimal("0.00")
        known_profit = Decimal("0.00")
        unknown_cost_revenue = Decimal("0.00")

        for item in items:
            sale = sales_by_id.get(
                getattr(item, "sale_id", None)
            )

            if not sale or sale.id not in paid_sale_ids:
                continue

            financials = get_pos_item_financials(item)

            if not financials:
                continue

            if financials["cost"] is None:
                unknown_cost_revenue += financials["revenue"]
            else:
                item_cost += financials["cost"]
                known_profit += financials["profit"]

        filtered_branch = branch_map.get(branch_id)

        if branch_id is not None:
            branch_filter_label = (
                getattr(filtered_branch, "name", None)
                or f"Branch ID {branch_id}"
            )
        else:
            branch_filter_label = "All branches"

        summary_rows = [
            ["Report", "All POS Reports Export"],
            [
                "Generated At",
                datetime.now().replace(microsecond=0)
            ],
            [
                "Start Date",
                start_date.date()
                if start_date else "All available dates"
            ],
            [
                "End Date",
                (end_date - timedelta(days=1)).date()
                if end_date else "All available dates"
            ],
            ["Branch Filter", branch_filter_label],
            ["POS Sales Records", len(all_sales)],
            ["Confirmed Paid Sales", len(paid_sales)],
            ["Voided/Cancelled Sales", len(void_sales)],
            ["Confirmed Sales Revenue", float(total_revenue)],
            ["Discounts on Confirmed Sales", float(total_discounts)],
            [
                "Known Historical Cost of Goods Sold",
                float(item_cost)
            ],
            [
                "Gross Profit on Items with Known Costs",
                float(known_profit)
            ],
            [
                "Sales Value with Unknown Historical Costs",
                float(unknown_cost_revenue)
            ],
            [
                "Average Confirmed Sale Value",
                float(total_revenue / len(paid_sales))
                if paid_sales else 0
            ],
            [
                "Profit Note",
                "Gross profit is partial when historical buying "
                "prices are missing; it is not net profit."
            ],
            [
                "Scope Note",
                "Cashier POS sales only. Website customer orders "
                "are excluded."
            ],
        ]

        write_table(
            summary_ws,
            ["Metric", "Value"],
            summary_rows
        )

        for cell in summary_ws[1]:
            cell.fill = title_fill
            cell.font = title_font

        # ----------------------------------------------------
        # BRANCH PERFORMANCE
        # ----------------------------------------------------

        for sale in paid_sales:
            key = getattr(sale, "branch_id", None)

            if key not in branch_totals:
                branch_totals[key] = {
                    "name": branch_name(sale),
                    "count": 0,
                    "revenue": Decimal("0.00"),
                    "cost": Decimal("0.00"),
                    "profit": Decimal("0.00"),
                    "unknown_cost_revenue": Decimal("0.00"),
                }

            branch_totals[key]["count"] += 1
            branch_totals[key]["revenue"] += decimal_value(
                sale.total
            )

        for item in items:
            sale = sales_by_id.get(
                getattr(item, "sale_id", None)
            )

            if not sale or sale.id not in paid_sale_ids:
                continue

            financials = get_pos_item_financials(item)

            if not financials:
                continue

            key = getattr(sale, "branch_id", None)

            if key not in branch_totals:
                branch_totals[key] = {
                    "name": branch_name(sale),
                    "count": 0,
                    "revenue": Decimal("0.00"),
                    "cost": Decimal("0.00"),
                    "profit": Decimal("0.00"),
                    "unknown_cost_revenue": Decimal("0.00"),
                }

            if financials["cost"] is None:
                branch_totals[key]["unknown_cost_revenue"] += (
                    financials["revenue"]
                )
            else:
                branch_totals[key]["cost"] += financials["cost"]
                branch_totals[key]["profit"] += financials["profit"]

        branch_rows = [
            [
                key,
                data["name"],
                data["count"],
                float(data["revenue"]),
                float(data["cost"]),
                float(data["profit"]),
                float(data["unknown_cost_revenue"]),
                (
                    "Complete"
                    if data["unknown_cost_revenue"] == 0
                    else "Incomplete: missing historical costs"
                ),
            ]
            for key, data in sorted(
                branch_totals.items(),
                key=lambda pair: pair[1]["revenue"],
                reverse=True
            )
        ]

        write_table(
            branch_ws,
            [
                "Branch ID",
                "Branch",
                "Confirmed Paid Sales",
                "Revenue",
                "Known Cost of Goods Sold",
                "Gross Profit on Known Costs",
                "Sales Value with Unknown Costs",
                "Cost Data Status",
            ],
            branch_rows
        )

        # ----------------------------------------------------
        # PRODUCT PERFORMANCE
        # ----------------------------------------------------

        product_rows = []

        for product_id, data in sorted(
            product_totals.items(),
            key=lambda pair: pair[1]["revenue"],
            reverse=True
        ):
            product_rows.append([
                product_id,
                data["name"],
                float(data["stock_qty"]),
                float(data["sale_qty"]),
                float(data["revenue"]),
                float(data["cost"]),
                float(data["profit"]),
                float(data["unknown_cost_revenue"]),
                (
                    "Complete"
                    if data["unknown_cost_revenue"] == 0
                    else "Incomplete: missing historical costs"
                ),
            ])

        write_table(
            product_ws,
            [
                "Product ID",
                "Product",
                "Stock Quantity Sold (3 d.p.)",
                "Selling Quantity Sold (3 d.p.)",
                "Revenue",
                "Known Cost of Goods Sold",
                "Gross Profit on Known Costs",
                "Sales Value with Unknown Costs",
                "Cost Data Status",
            ],
            product_rows
        )

        # ----------------------------------------------------
        # VOIDED SALES
        # ----------------------------------------------------

        void_rows = []

        for sale in void_sales:
            void_rows.append([
                getattr(sale, "id", None),
                getattr(sale, "sale_number", None),
                safe_datetime(
                    getattr(sale, "created_at", None)
                ),
                getattr(sale, "branch_id", None),
                branch_name(sale),
                getattr(sale, "cashier_id", None),
                cashier_name(sale),
                getattr(sale, "total", None),
                getattr(sale, "payment_status", None),
                getattr(sale, "status", None),
            ])

        write_table(
            void_ws,
            [
                "Sale ID",
                "Sale Number",
                "Date/Time",
                "Branch ID",
                "Branch",
                "Cashier ID",
                "Cashier",
                "Recorded Total",
                "Payment Status",
                "Sale Status",
            ],
            void_rows
        )

        # ----------------------------------------------------
        # BRANCH-SPECIFIC WORKSHEETS — BRANCH 1 AND BRANCH 2
        # ----------------------------------------------------
        # Keep the existing consolidated worksheets above, and add
        # separate worksheets for each branch so their transactions
        # and figures can be reviewed without mixing the data.

        # Load branch records even when a branch has no sales in the
        # selected date range, so the workbook still labels it correctly.
        branch_records = {
            branch.id: branch
            for branch in Branch.query.filter(Branch.id.in_([1, 2])).all()
        }
        branch_records.update(branch_map)

        for branch_number in (1, 2):
            branch_sales = [
                sale for sale in all_sales
                if getattr(sale, "branch_id", None) == branch_number
            ]
            branch_sale_ids = {sale.id for sale in branch_sales}
            branch_paid_sales = [
                sale for sale in branch_sales
                if sale.id in paid_sale_ids
            ]
            branch_paid_ids = {sale.id for sale in branch_paid_sales}
            branch_void_sales = [
                sale for sale in branch_sales
                if normalize_status(getattr(sale, "status", None))
                in POS_INACTIVE_SALE_STATUSES
            ]
            branch_items = [
                item for item in items
                if getattr(item, "sale_id", None) in branch_sale_ids
            ]
            branch_payments = [
                payment for payment in payments
                if getattr(payment, "sale_id", None) in branch_sale_ids
            ]

            branch_record = branch_records.get(branch_number)
            branch_label = (
                getattr(branch_record, "name", None)
                or f"Branch {branch_number}"
            )
            sheet_prefix = f"Branch {branch_number}"

            # Separate branch summary.
            branch_revenue = sum(
                (decimal_value(sale.total) for sale in branch_paid_sales),
                Decimal("0.00")
            )
            branch_discounts = sum(
                (
                    decimal_value(getattr(sale, "discount", 0))
                    for sale in branch_paid_sales
                ),
                Decimal("0.00")
            )
            branch_cost = Decimal("0.00")
            branch_profit = Decimal("0.00")
            branch_unknown_cost_revenue = Decimal("0.00")

            for item in branch_items:
                sale = next(
                    (sale for sale in branch_sales
                     if sale.id == getattr(item, "sale_id", None)),
                    None
                )
                if not sale or sale.id not in branch_paid_ids:
                    continue
                financials = get_pos_item_financials(item)
                if not financials:
                    continue
                if financials["cost"] is None:
                    branch_unknown_cost_revenue += financials["revenue"]
                else:
                    branch_cost += financials["cost"]
                    branch_profit += financials["profit"]

            branch_summary_ws = workbook.create_sheet(
                f"{sheet_prefix} Summary"
            )
            branch_summary_rows = [
                ["Report", f"{branch_label} POS Summary"],
                ["Generated At", datetime.now().replace(microsecond=0)],
                ["Branch ID", branch_number],
                ["Branch", branch_label],
                ["Start Date", start_date.date() if start_date else "All available dates"],
                ["End Date", (end_date - timedelta(days=1)).date() if end_date else "All available dates"],
                ["POS Sales Records", len(branch_sales)],
                ["Confirmed Paid Sales", len(branch_paid_sales)],
                ["Voided/Cancelled Sales", len(branch_void_sales)],
                ["Confirmed Sales Revenue", float(branch_revenue)],
                ["Discounts on Confirmed Sales", float(branch_discounts)],
                ["Known Historical Cost of Goods Sold", float(branch_cost)],
                ["Gross Profit on Items with Known Costs", float(branch_profit)],
                ["Sales Value with Unknown Historical Costs", float(branch_unknown_cost_revenue)],
                ["Average Confirmed Sale Value", float(branch_revenue / len(branch_paid_sales)) if branch_paid_sales else 0],
                ["Profit Note", "Gross profit is partial where historical buying prices are missing; it is not net profit."],
                ["Scope Note", "Cashier POS sales only. Website customer orders are excluded."],
            ]
            write_table(branch_summary_ws, ["Metric", "Value"], branch_summary_rows)
            for cell in branch_summary_ws[1]:
                cell.fill = title_fill
                cell.font = title_font

            # Branch-only sales records.
            branch_sales_ws = workbook.create_sheet(f"{sheet_prefix} Sales")
            branch_sales_rows = [[
                getattr(sale, "id", None),
                getattr(sale, "sale_number", None),
                safe_datetime(getattr(sale, "created_at", None)),
                getattr(sale, "branch_id", None),
                branch_label,
                getattr(sale, "cashier_id", None),
                cashier_name(sale),
                getattr(sale, "customer_name", None),
                getattr(sale, "subtotal", None),
                getattr(sale, "discount", None),
                getattr(sale, "total", None),
                getattr(sale, "payment_method", None),
                getattr(sale, "payment_status", None),
                getattr(sale, "status", None),
                "Yes" if sale.id in paid_sale_ids else "No",
            ] for sale in branch_sales]
            write_table(branch_sales_ws, [
                "Sale ID", "Sale Number", "Date/Time", "Branch ID", "Branch",
                "Cashier ID", "Cashier", "Customer", "Subtotal", "Discount",
                "Sale Total", "Payment Method", "Payment Status", "Sale Status",
                "Counts as Confirmed Paid Sale",
            ], branch_sales_rows)

            # Branch-only sale items.
            branch_items_ws = workbook.create_sheet(f"{sheet_prefix} Items")
            branch_item_rows = []
            for item in branch_items:
                sale = next(
                    (sale for sale in branch_sales
                     if sale.id == getattr(item, "sale_id", None)),
                    None
                )
                financials = get_pos_item_financials(item)
                product = product_map.get(getattr(item, "product_id", None))
                product_name = getattr(product, "name", None) or "Deleted product"
                stock_qty = financials["stock_quantity"] if financials else decimal_value(getattr(item, "quantity", 0), "0")
                sale_qty = financials["sale_quantity"] if financials else decimal_value(getattr(item, "sale_quantity", getattr(item, "quantity", 0)), "0")
                unit_price = financials["selling_price"] if financials else decimal_value(getattr(item, "price", 0), "0")
                revenue = financials["revenue"] if financials else Decimal("0.00")
                buying_price = financials["buying_price"] if financials else None
                cost = financials["cost"] if financials else None
                profit = financials["profit"] if financials else None
                branch_item_rows.append([
                    getattr(item, "id", None),
                    getattr(item, "sale_id", None),
                    getattr(sale, "sale_number", None) if sale else None,
                    safe_datetime(getattr(sale, "created_at", None)) if sale else None,
                    branch_label,
                    getattr(item, "product_id", None),
                    product_name,
                    float(stock_qty),
                    float(sale_qty),
                    float(unit_price),
                    float(buying_price) if buying_price is not None else None,
                    float(revenue),
                    float(cost) if cost is not None else None,
                    float(profit) if profit is not None else None,
                    "Known" if buying_price is not None else "Unknown",
                    "Yes" if sale and sale.id in paid_sale_ids else "No",
                ])
            write_table(branch_items_ws, [
                "Item ID", "Sale ID", "Sale Number", "Sale Date/Time", "Branch",
                "Product ID", "Product", "Stock Quantity (3 d.p.)",
                "Selling Quantity (3 d.p.)", "Selling Unit Price",
                "Historical Buying Price", "Line Revenue", "Cost of Goods Sold",
                "Gross Profit", "Cost Data", "Confirmed Paid Sale",
            ], branch_item_rows)

            # Branch-only payment records.
            branch_payments_ws = workbook.create_sheet(f"{sheet_prefix} Payments")
            branch_payment_rows = []
            branch_sales_lookup = {sale.id: sale for sale in branch_sales}
            for payment in branch_payments:
                sale = branch_sales_lookup.get(getattr(payment, "sale_id", None))
                branch_payment_rows.append([
                    getattr(payment, "id", None),
                    getattr(payment, "sale_id", None),
                    getattr(sale, "sale_number", None) if sale else None,
                    safe_datetime(getattr(payment, "created_at", getattr(payment, "paid_at", None))),
                    getattr(payment, "method", getattr(payment, "payment_method", None)),
                    getattr(payment, "amount", None),
                    getattr(payment, "status", None),
                    getattr(payment, "transaction_reference", getattr(payment, "reference", None)),
                    getattr(payment, "notes", None),
                ])
            write_table(branch_payments_ws, [
                "Payment ID", "Sale ID", "Sale Number", "Payment Date/Time",
                "Payment Method", "Amount", "Payment Status",
                "Transaction Reference", "Notes",
            ], branch_payment_rows)

            # Branch-only voided/cancelled sales.
            branch_void_ws = workbook.create_sheet(f"{sheet_prefix} Voided")
            branch_void_rows = [[
                getattr(sale, "id", None),
                getattr(sale, "sale_number", None),
                safe_datetime(getattr(sale, "created_at", None)),
                getattr(sale, "branch_id", None),
                branch_label,
                getattr(sale, "cashier_id", None),
                cashier_name(sale),
                getattr(sale, "total", None),
                getattr(sale, "payment_status", None),
                getattr(sale, "status", None),
            ] for sale in branch_void_sales]
            write_table(branch_void_ws, [
                "Sale ID", "Sale Number", "Date/Time", "Branch ID", "Branch",
                "Cashier ID", "Cashier", "Recorded Total", "Payment Status", "Sale Status",
            ], branch_void_rows)

        # ----------------------------------------------------
        # FORMATTING
        # ----------------------------------------------------

        money_headers = {
            "Subtotal",
            "Discount",
            "Sale Total",
            "Amount",
            "Selling Unit Price",
            "Historical Buying Price",
            "Line Revenue",
            "Cost of Goods Sold",
            "Gross Profit",
            "Revenue",
            "Known Cost of Goods Sold",
            "Gross Profit on Known Costs",
            "Sales Value with Unknown Costs",
            "Confirmed Sales Revenue",
            "Discounts on Confirmed Sales",
            "Known Historical Cost of Goods Sold",
            "Gross Profit on Items with Known Costs",
            "Average Confirmed Sale Value",
            "Confirmed Sales Revenue",
            "Recorded Total",
        }

        for ws in workbook.worksheets:
            for row in ws.iter_rows(min_row=2):
                for cell in row:
                    header = ws.cell(
                        row=1,
                        column=cell.column
                    ).value

                    if (
                        header in money_headers
                        and isinstance(cell.value, (int, float, Decimal))
                    ):
                        cell.number_format = (
                            '#,##0.00;[Red]-#,##0.00'
                        )

                    if (
                        header
                        and "Quantity" in str(header)
                        and isinstance(cell.value, (int, float, Decimal))
                    ):
                        cell.number_format = "0.000"

                    if (
                        header
                        and (
                            "Date" in str(header)
                            or header == "Generated At"
                        )
                        and isinstance(cell.value, datetime)
                    ):
                        cell.number_format = "yyyy-mm-dd hh:mm:ss"

            for cell in ws[1]:
                cell.alignment = Alignment(
                    horizontal="center",
                    vertical="center",
                    wrap_text=True
                )

            ws.row_dimensions[1].height = 30

        # ----------------------------------------------------
        # SAVE WORKBOOK
        # ----------------------------------------------------

        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        filename_parts = ["myduka_pos_reports"]

        if start_date:
            filename_parts.append(
                start_date.strftime("%Y%m%d")
            )

        if end_date:
            filename_parts.append(
                (end_date - timedelta(days=1)).strftime("%Y%m%d")
            )

        filename = "_".join(filename_parts) + ".xlsx"

        return send_file(
            output,
            mimetype=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            as_attachment=True,
            download_name=filename,
        )

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to export POS reports to Excel."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to export POS reports to Excel.",
        }), 500


# ============================================================
# INTERBRANCH STOCK TRANSFERS — ADMIN ONLY
#
# GET  /api/admin/stock-transfers
# POST /api/admin/stock-transfers
#
# Transfers complete immediately.
# Both branches update in one database transaction.
# ============================================================


def parse_transfer_quantity(value):
    """
    Validate a positive quantity with a maximum of 3
    meaningful decimal places.
    """

    try:
        quantity = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Invalid transfer quantity.")

    if not quantity.is_finite():
        raise ValueError("Invalid transfer quantity.")

    if quantity <= 0:
        raise ValueError(
            "Transfer quantities must be greater than zero."
        )

    if quantity != quantity.quantize(Decimal("0.001")):
        raise ValueError(
            "Transfer quantities support a maximum of 3 decimal places."
        )

    if quantity > Decimal("999999999.999"):
        raise ValueError("Transfer quantity is too large.")

    return quantity


def generate_transfer_reference():
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_part = uuid.uuid4().hex[:8].upper()

    return f"TRF-{timestamp}-{unique_part}"


# ============================================================
# GET TRANSFER HISTORY
# ============================================================

@admin_bp.route(
    "/api/admin/stock-transfers",
    methods=["GET"]
)
@admin_required
def get_stock_transfers():
    """Return paginated transfer history, including both product names."""
    try:
        query = StockTransfer.query
        branch_id = request.args.get("branch_id", type=int)

        if branch_id is not None:
            if branch_id <= 0:
                return jsonify({
                    "status": "error",
                    "message": "Invalid branch ID."
                }), 400
            query = query.filter(or_(
                StockTransfer.source_branch_id == branch_id,
                StockTransfer.destination_branch_id == branch_id
            ))

        limit = max(1, min(request.args.get("limit", default=100, type=int) or 100, 500))
        offset = max(0, request.args.get("offset", default=0, type=int) or 0)
        total = query.order_by(None).count()

        transfers = (
            query.options(selectinload(StockTransfer.items))
            .order_by(StockTransfer.created_at.desc(), StockTransfer.id.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        serialized = []
        for transfer in transfers:
            item_data = transfer.to_dict()
            serialized_items = item_data.get("items", []) or []
            destination_ids = {
                getattr(item, "destination_product_id", None)
                for item in (transfer.items or [])
                if getattr(item, "destination_product_id", None) is not None
            }
            destination_products = {}
            if destination_ids:
                destination_products = {
                    product.id: product.name
                    for product in Product.query.filter(Product.id.in_(destination_ids)).all()
                }

            # Preserve the model's item order and all existing keys.
            for index, item in enumerate(transfer.items or []):
                if index < len(serialized_items):
                    destination_id = getattr(item, "destination_product_id", None)
                    serialized_items[index]["destination_product_id"] = destination_id
                    serialized_items[index]["destination_product_name"] = (
                        destination_products.get(destination_id) or "Unknown product"
                    )
            item_data["items"] = serialized_items
            serialized.append(item_data)

        return jsonify({
            "status": "success",
            "transfers": serialized,
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200

    except Exception:
        db.session.rollback()
        logger.exception("Failed to retrieve stock transfer history.")
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve stock transfers."
        }), 500


@admin_bp.route(
    "/api/admin/stock-transfers",
    methods=["POST"]
)
@admin_required
def create_stock_transfer():
    """
    Transfer stock between branches using an explicitly selected
    source product and destination product for every line item.

    Required payload:
    {
      "source_branch_id": 1,
      "destination_branch_id": 2,
      "items": [
        {
          "product_id": 15,
          "destination_product_id": 42,
          "quantity": "2.500"
        }
      ],
      "notes": "Optional"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        source_branch_id = data.get("source_branch_id")
        destination_branch_id = data.get("destination_branch_id")
        items_data = data.get("items")
        notes = data.get("notes")

        # Support admin context stored as either a dictionary or object.
        admin_context = getattr(g, "admin", None)
        admin_username = None
        if isinstance(admin_context, dict):
            admin_username = admin_context.get("username") or admin_context.get("name")
        elif admin_context is not None:
            admin_username = getattr(admin_context, "username", None) or getattr(admin_context, "name", None)
        admin_username = (
            admin_username
            or getattr(g, "admin_username", None)
            or "Admin"
        )
        admin_username = str(admin_username).strip()[:100] or "Admin"

        try:
            source_branch_id = int(source_branch_id)
            destination_branch_id = int(destination_branch_id)
        except (TypeError, ValueError):
            raise ValueError("Select valid source and destination branches.")

        if source_branch_id <= 0 or destination_branch_id <= 0:
            raise ValueError("Select valid source and destination branches.")
        if source_branch_id == destination_branch_id:
            raise ValueError("Source and destination branches must be different.")
        if not isinstance(items_data, list) or not items_data:
            raise ValueError("Add at least one product to the transfer.")

        validated_items = []
        seen_pairs = set()
        for index, item in enumerate(items_data, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"Transfer item {index} is invalid.")
            try:
                source_product_id = int(item.get("product_id"))
                destination_product_id = int(item.get("destination_product_id"))
            except (TypeError, ValueError):
                raise ValueError(
                    f"Select both source and destination products for item {index}."
                )

            if source_product_id <= 0 or destination_product_id <= 0:
                raise ValueError(f"Invalid product selection in transfer item {index}.")

            pair = (source_product_id, destination_product_id)
            if pair in seen_pairs:
                raise ValueError(
                    "The same source/destination product pair cannot appear twice. "
                    "Combine its quantities into one line."
                )
            seen_pairs.add(pair)

            validated_items.append({
                "product_id": source_product_id,
                "destination_product_id": destination_product_id,
                "quantity": parse_transfer_quantity(item.get("quantity")),
            })

        # Lock branches in ascending order to reduce deadlock risk.
        branch_ids = sorted((source_branch_id, destination_branch_id))
        locked_branches = (
            Branch.query.filter(Branch.id.in_(branch_ids))
            .order_by(Branch.id.asc())
            .with_for_update()
            .all()
        )
        branches = {branch.id: branch for branch in locked_branches}
        if len(branches) != 2:
            raise ValueError("One or both selected branches do not exist.")

        source_branch = branches[source_branch_id]
        destination_branch = branches[destination_branch_id]
        if not source_branch.is_active:
            raise ValueError("The source branch is inactive.")
        if not destination_branch.is_active:
            raise ValueError("The destination branch is inactive.")

        transfer = StockTransfer(
            reference=generate_transfer_reference(),
            source_branch_id=source_branch_id,
            destination_branch_id=destination_branch_id,
            status="COMPLETED",
            admin_username=admin_username,
            notes=notes.strip() if isinstance(notes, str) and notes.strip() else None
        )
        db.session.add(transfer)
        db.session.flush()

        for item in validated_items:
            source_product_id = item["product_id"]
            destination_product_id = item["destination_product_id"]
            quantity = item["quantity"]

            # Lock both selected products and validate they exist and are active.
            product_ids = sorted({source_product_id, destination_product_id})
            products = (
                Product.query.filter(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
                .all()
            )
            products_by_id = {product.id: product for product in products}
            source_product = products_by_id.get(source_product_id)
            destination_product = products_by_id.get(destination_product_id)

            if source_product is None:
                raise ValueError(f"Source product ID {source_product_id} does not exist.")
            if destination_product is None:
                raise ValueError(f"Destination product ID {destination_product_id} does not exist.")
            if not source_product.is_active:
                raise ValueError(f"Source product '{source_product.name}' is inactive.")
            if not destination_product.is_active:
                raise ValueError(f"Destination product '{destination_product.name}' is inactive.")

            # Lock the source stock row. It must already exist because this
            # product is selected from the source branch's current stock list.
            source_stock = (
                BranchProductStock.query
                .filter_by(branch_id=source_branch_id, product_id=source_product_id)
                .with_for_update()
                .first()
            )
            if source_stock is None:
                raise ValueError(
                    f"'{source_product.name}' has no stock record in {source_branch.name}."
                )

            # Lock destination stock if present. If absent, create a zero row
            # for the explicitly selected destination catalog product.
            destination_stock = (
                BranchProductStock.query
                .filter_by(branch_id=destination_branch_id, product_id=destination_product_id)
                .with_for_update()
                .first()
            )
            if destination_stock is None:
                destination_stock = BranchProductStock(
                    branch_id=destination_branch_id,
                    product_id=destination_product_id,
                    quantity=Decimal("0.000")
                )
                db.session.add(destination_stock)
                db.session.flush()

            source_previous = Decimal(str(source_stock.quantity or "0.000"))
            destination_previous = Decimal(str(destination_stock.quantity or "0.000"))

            if source_previous < quantity:
                raise ValueError(
                    f"Insufficient stock for '{source_product.name}' in {source_branch.name}. "
                    f"Available: {source_previous:.3f}; requested: {quantity:.3f}."
                )

            source_new = source_previous - quantity
            destination_new = destination_previous + quantity
            if source_new < 0:
                raise ValueError("The transfer would make source stock negative.")
            if destination_new > Decimal("999999999.999"):
                raise ValueError(
                    f"The destination stock limit would be exceeded for '{destination_product.name}'."
                )

            source_stock.quantity = source_new
            destination_stock.quantity = destination_new

            db.session.add(StockTransferItem(
                transfer_id=transfer.id,
                product_id=source_product_id,
                destination_product_id=destination_product_id,
                product_name=source_product.name,
                quantity=quantity,
                source_previous_stock=source_previous,
                source_new_stock=source_new,
                destination_previous_stock=destination_previous,
                destination_new_stock=destination_new
            ))

            db.session.add(StockMovement(
                cashier_id=None,
                admin_username=admin_username,
                movement_type="TRANSFER_OUT",
                product_id=source_product_id,
                product_name=source_product.name,
                branch_id=source_branch_id,
                previous_stock=source_previous,
                quantity_added=quantity,
                new_stock=source_new,
                reference=transfer.reference,
                notes=(
                    f"Transferred {quantity:.3f} of '{source_product.name}' "
                    f"to '{destination_product.name}' at {destination_branch.name}."
                )
            ))

            db.session.add(StockMovement(
                cashier_id=None,
                admin_username=admin_username,
                movement_type="TRANSFER_IN",
                product_id=destination_product_id,
                product_name=destination_product.name,
                branch_id=destination_branch_id,
                previous_stock=destination_previous,
                quantity_added=quantity,
                new_stock=destination_new,
                reference=transfer.reference,
                notes=(
                    f"Received {quantity:.3f} of '{destination_product.name}' "
                    f"from '{source_product.name}' at {source_branch.name}."
                )
            ))

        db.session.commit()

        # Add destination product labels to the immediate response as well.
        result = transfer.to_dict()
        result_items = result.get("items", []) or []
        for index, item in enumerate(transfer.items or []):
            if index < len(result_items):
                result_items[index]["destination_product_id"] = item.destination_product_id
                result_items[index]["destination_product_name"] = (
                    item.destination_product.name
                    if getattr(item, "destination_product", None)
                    else (Product.query.get(item.destination_product_id).name
                          if Product.query.get(item.destination_product_id) else "Unknown product")
                )
        result["items"] = result_items

        return jsonify({
            "status": "success",
            "message": "Stock transfer completed successfully.",
            "transfer": result
        }), 201

    except ValueError as error:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except IntegrityError:
        db.session.rollback()
        logger.exception("Stock transfer database integrity error.")
        return jsonify({
            "status": "error",
            "message": (
                "The transfer could not be completed because of a database "
                "constraint or concurrent stock update. Refresh and try again."
            )
        }), 409

    except Exception:
        db.session.rollback()
        logger.exception("Failed to complete interbranch stock transfer.")
        return jsonify({
            "status": "error",
            "message": "Unable to complete stock transfer. Check the server logs."
        }), 500

