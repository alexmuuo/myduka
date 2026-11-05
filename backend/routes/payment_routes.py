import os
import logging
import base64

from datetime import datetime
from decimal import Decimal, InvalidOperation

import requests

from flask import Blueprint, request, jsonify, g
from sqlalchemy import select

from extensions import db
from tenancy import set_tenant, shop_context_required, unscoped
from cashier_auth import cashier_required

from models.order import Order
from models.payment import Payment
from models.product import Product
from models.cashier_sale import CashierSale
from models.cashier_sale_payment import CashierSalePayment
from models.branch_product_stock import BranchProductStock


# ============================================================
# CONFIGURATION
# ============================================================

payment_bp = Blueprint(
    "payments",
    __name__,
    url_prefix="/api/payments",
)

logger = logging.getLogger(__name__)

DARAJA_BASE_URL = "https://sandbox.safaricom.co.ke"


# ============================================================
# PHONE NUMBER HELPERS
# ============================================================

def normalize_phone(phone):
    """
    Normalize a Kenyan mobile number to 254XXXXXXXXX format.
    """

    if not phone:
        raise ValueError("A phone number is required.")

    phone = (
        str(phone)
        .strip()
        .replace(" ", "")
        .replace("-", "")
    )

    if phone.startswith("+254"):
        phone = phone[1:]

    elif phone.startswith("254"):
        pass

    elif phone.startswith("0"):
        phone = "254" + phone[1:]

    elif len(phone) == 9 and phone[0] in ("7", "1"):
        phone = "254" + phone

    else:
        raise ValueError("Use a valid Kenyan phone number.")

    if (
        len(phone) != 12
        or not phone.isdigit()
        or phone[:4] not in ("2547", "2541")
    ):
        raise ValueError("Use a valid Kenyan mobile number.")

    return phone


# ============================================================
# SAFARICOM DARAJA HELPERS
# ============================================================

def get_mpesa_access_token():
    """
    Obtain an OAuth access token from Safaricom Daraja.
    """

    consumer_key = os.getenv("MPESA_CONSUMER_KEY")
    consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")

    if not consumer_key or not consumer_secret:
        raise RuntimeError(
            "M-Pesa credentials are not configured."
        )

    response = requests.get(
        f"{DARAJA_BASE_URL}/oauth/v1/generate",
        params={"grant_type": "client_credentials"},
        auth=(consumer_key, consumer_secret),
        timeout=30,
    )

    response.raise_for_status()

    try:
        response_data = response.json()

    except ValueError as error:
        raise RuntimeError(
            "Safaricom returned an invalid OAuth response."
        ) from error

    access_token = response_data.get("access_token")

    if not access_token:
        raise RuntimeError(
            "Safaricom did not return an access token."
        )

    return access_token


def build_stk_payload(
    shortcode,
    passkey,
    phone,
    amount,
    account_reference,
    transaction_description,
):
    """
    Construct the Safaricom STK Push request payload.
    """

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode("utf-8")
    ).decode("utf-8")

    callback_url = os.getenv("MPESA_CALLBACK_URL")

    if not callback_url:
        raise RuntimeError(
            "MPESA_CALLBACK_URL is not configured."
        )

    return {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": os.getenv(
            "MPESA_TRANSACTION_TYPE",
            "CustomerPayBillOnline",
        ),
        "Amount": amount,
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": str(account_reference)[:12],
        "TransactionDesc": transaction_description[:13],
    }


def request_stk_push(
    phone,
    amount,
    account_reference,
    transaction_description,
):
    """
    Initiate an STK Push through Safaricom Daraja.
    """

    shortcode = os.getenv("MPESA_SHORTCODE")
    passkey = os.getenv("MPESA_PASSKEY")

    if not shortcode or not passkey:
        raise RuntimeError(
            "M-Pesa configuration is incomplete."
        )

    try:
        amount_decimal = Decimal(str(amount))

    except (InvalidOperation, TypeError, ValueError) as error:
        raise ValueError("Invalid payment amount.") from error

    if (
        not amount_decimal.is_finite()
        or amount_decimal < 1
        or amount_decimal != amount_decimal.quantize(Decimal("1"))
    ):
        raise ValueError(
            "Payment amount must be a positive whole number of KSh."
        )

    access_token = get_mpesa_access_token()

    payload = build_stk_payload(
        shortcode=shortcode,
        passkey=passkey,
        phone=phone,
        amount=int(amount_decimal),
        account_reference=account_reference,
        transaction_description=transaction_description,
    )

    response = requests.post(
        f"{DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=30,
    )

    try:
        result = response.json()

    except ValueError as error:
        raise RuntimeError(
            "Safaricom returned an invalid response."
        ) from error

    if (
        not response.ok
        or str(result.get("ResponseCode")) != "0"
    ):
        raise RuntimeError(
            result.get("errorMessage")
            or result.get("ResponseDescription")
            or "Safaricom rejected the STK Push request."
        )

    if not result.get("CheckoutRequestID"):
        raise RuntimeError(
            "Safaricom returned no checkout request ID."
        )

    return result


# ============================================================
# LEGACY CASHIER ORDER HELPERS
# ============================================================

def is_cashier_order(order):
    """
    Identify legacy POS sales stored as website orders.
    """

    return bool(
        order
        and order.notes
        and "Cashier sale processed by " in order.notes
    )


def restore_cashier_stock_once(order):
    """
    Restore global Product.stock for a legacy POS transaction
    that was stored as a website Order.

    Never use this helper for CashierSale transactions.
    """

    if not is_cashier_order(order):
        return

    if (order.status or "").lower() in ("cancelled", "canceled"):
        return

    if (order.payment_status or "").lower() == "paid":
        return

    items = list(order.items)

    product_ids = sorted({
        item.product_id
        for item in items
    })

    products = (
        db.session.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .order_by(Product.id)
            .with_for_update()
        ).scalars().all()
        if product_ids
        else []
    )

    products_by_id = {
        product.id: product
        for product in products
    }

    for item in items:
        if item.product_id not in products_by_id:
            raise RuntimeError(
                f"Cannot restore missing product {item.product_id}."
            )

    for item in items:
        products_by_id[item.product_id].stock += item.quantity

    order.status = "cancelled"
    order.payment_status = "failed"

    order.notes = (
        f"{order.notes or ''}\n"
        "M-Pesa payment failed; reserved stock restored."
    )


# ============================================================
# BRANCH-SPECIFIC CASHIER STOCK HELPERS
# ============================================================

def restore_branch_stock_once(sale):
    """
    Restore branch-specific stock for a failed cashier sale.

    This helper never modifies Product.stock.
    """

    if (sale.status or "").lower() in ("cancelled", "canceled"):
        return

    if (sale.payment_status or "").lower() == "paid":
        return

    items = list(sale.items)

    product_ids = sorted({
        item.product_id
        for item in items
    })

    stock_rows = (
        db.session.execute(
            select(BranchProductStock)
            .where(
                BranchProductStock.branch_id == sale.branch_id,
                BranchProductStock.product_id.in_(product_ids),
            )
            .order_by(BranchProductStock.product_id)
            .with_for_update()
        ).scalars().all()
        if product_ids
        else []
    )

    stock_by_product = {
        row.product_id: row
        for row in stock_rows
    }

    for item in items:
        if item.product_id not in stock_by_product:
            raise RuntimeError(
                "Cannot restore branch stock: "
                f"product {item.product_id} has no stock row "
                f"for branch {sale.branch_id}."
            )

    for item in items:
        stock_by_product[item.product_id].quantity += item.quantity

    sale.status = "cancelled"
    sale.payment_status = "failed"


# ============================================================
# CALLBACK VALIDATION HELPERS
# ============================================================

def extract_callback_details(callback):
    """
    Extract the M-Pesa receipt, amount, and phone number.
    """

    metadata = (
        callback.get("CallbackMetadata") or {}
    ).get("Item", [])

    details = {
        item["Name"]: item.get("Value")
        for item in metadata
        if isinstance(item, dict) and "Name" in item
    }

    return (
        details.get("MpesaReceiptNumber"),
        details.get("Amount"),
        details.get("PhoneNumber"),
    )


def validate_callback_payment(
    payment,
    receipt,
    callback_amount,
    callback_phone,
):
    """
    Validate callback details against the stored payment.
    """

    if (
        not receipt
        or callback_amount is None
        or callback_phone is None
    ):
        return False, "Payment confirmation is incomplete."

    try:
        received_amount = Decimal(str(callback_amount))
        expected_amount = Decimal(str(payment.amount))

    except (InvalidOperation, TypeError, ValueError):
        return False, "Invalid payment amount."

    if (
        not received_amount.is_finite()
        or received_amount != expected_amount
    ):
        return False, "Payment amount mismatch."

    try:
        callback_phone = normalize_phone(callback_phone)
        stored_phone = normalize_phone(payment.phone_number)

    except (TypeError, ValueError):
        return False, "Invalid payment phone number."

    if callback_phone != stored_phone:
        return False, "Payment phone number mismatch."

    return True, None


def receipt_exists_in_any_payment_table(receipt):
    """
    Prevent an M-Pesa receipt from being used for multiple payments.
    """

    customer_duplicate = db.session.execute(
        select(Payment.id)
        .where(
            Payment.mpesa_receipt_number == str(receipt)
        )
        .limit(1)
    ).scalar_one_or_none()

    if customer_duplicate is not None:
        return True

    cashier_duplicate = db.session.execute(
        select(CashierSalePayment.id)
        .where(
            CashierSalePayment.mpesa_receipt_number == str(receipt)
        )
        .limit(1)
    ).scalar_one_or_none()

    return cashier_duplicate is not None


# ============================================================
# CUSTOMER WEBSITE STK PUSH
# POST /api/payments/stk-push
# ============================================================

@payment_bp.route("/stk-push", methods=["POST"])
@shop_context_required
def initiate_stk_push():
    """
    Initiate M-Pesa payment for a website Order.

    This endpoint does not create or process CashierSale records.
    """

    data = request.get_json(silent=True) or {}

    order_id = data.get("order_id")
    phone = data.get("phone")

    if order_id is None or not phone:
        return jsonify({
            "error": "order_id and phone are required."
        }), 400

    try:
        order_id = int(order_id)

        if order_id <= 0:
            raise ValueError("Invalid order ID.")

        phone = normalize_phone(phone)

    except (TypeError, ValueError, OverflowError) as error:
        return jsonify({
            "error": str(error) or "Invalid order ID or phone number."
        }), 400

    try:
        order = db.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not order:
            db.session.rollback()

            return jsonify({
                "error": "Order not found."
            }), 404

        if is_cashier_order(order):
            db.session.rollback()

            return jsonify({
                "error": "Use the dedicated cashier payment endpoint."
            }), 403

        if (order.payment_method or "").lower() != "mpesa":
            db.session.rollback()

            return jsonify({
                "error": "This order is not configured for M-Pesa."
            }), 400

        if (order.payment_status or "").lower() == "paid":
            db.session.rollback()

            return jsonify({
                "error": "This order has already been paid."
            }), 409

        if (order.status or "").lower() in (
            "cancelled",
            "canceled",
            "completed",
        ):
            db.session.rollback()

            return jsonify({
                "error": "This order cannot be paid in its current state."
            }), 409

        existing_payment = db.session.execute(
            select(Payment)
            .where(
                Payment.order_id == order.id,
                Payment.status == "pending",
            )
            .with_for_update()
        ).scalar_one_or_none()

        if existing_payment:
            db.session.rollback()

            return jsonify({
                "error": "A payment is already pending for this order.",
                "payment_status": "pending",
            }), 409

        result = request_stk_push(
            phone=phone,
            amount=order.total,
            account_reference=order.order_number,
            transaction_description="Website order",
        )

        payment = Payment(
            order_id=order.id,
            checkout_request_id=result["CheckoutRequestID"],
            merchant_request_id=result.get("MerchantRequestID"),
            phone_number=phone,
            amount=Decimal(str(order.total)),
            status="pending",
        )

        db.session.add(payment)
        db.session.commit()

        return jsonify({
            "message": "Payment prompt initiated. Check your phone.",
            "order_id": order.id,
            "checkout_request_id": payment.checkout_request_id,
            "payment_status": "pending",
        }), 200

    except ValueError as error:
        db.session.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    except requests.RequestException:
        db.session.rollback()

        logger.exception(
            "Safaricom request failed for customer checkout."
        )

        return jsonify({
            "error": (
                "Safaricom could not be reached. "
                "Check payment status before retrying."
            )
        }), 502

    except RuntimeError as error:
        db.session.rollback()

        logger.warning(
            "Customer STK Push was rejected: %s",
            error,
        )

        return jsonify({
            "error": "Could not initiate M-Pesa payment.",
            "details": str(error),
        }), 502

    except Exception:
        db.session.rollback()

        logger.exception("Customer STK Push failed.")

        return jsonify({
            "error": "Payment could not be initiated."
        }), 500


# ============================================================
# CASHIER POS STK PUSH
# POST /api/payments/cashier-stk-push
# ============================================================

@payment_bp.route("/cashier-stk-push", methods=["POST"])
@cashier_required
def initiate_cashier_stk_push():
    """
    Initiate M-Pesa payment for an independent CashierSale.

    The authenticated cashier can initiate payment only for
    their own sale. This endpoint never treats a sale ID as
    a website Order ID.
    """

    cashier = getattr(g, "cashier", None)

    if not cashier or not getattr(cashier, "is_active", False):
        return jsonify({
            "error": "Active cashier authentication is required."
        }), 401

    data = request.get_json(silent=True) or {}

    sale_id = data.get("sale_id")
    phone = data.get("phone")

    if sale_id is None or not phone:
        return jsonify({
            "error": "sale_id and phone are required."
        }), 400

    try:
        sale_id = int(sale_id)

        if sale_id <= 0:
            raise ValueError("Invalid sale ID.")

        phone = normalize_phone(phone)

    except (TypeError, ValueError, OverflowError) as error:
        return jsonify({
            "error": str(error) or "Invalid sale ID or phone number."
        }), 400

    try:
        # Enforce sale ownership in the database query.
        sale = db.session.execute(
            select(CashierSale)
            .where(
                CashierSale.id == sale_id,
                CashierSale.cashier_id == cashier.id,
            )
            .with_for_update()
        ).scalar_one_or_none()

        if not sale:
            db.session.rollback()

            return jsonify({
                "error": "Cashier sale not found."
            }), 404

        if (
            cashier.branch_id is None
            or sale.branch_id != cashier.branch_id
        ):
            db.session.rollback()

            return jsonify({
                "error": "This sale does not belong to your branch."
            }), 403

        if (sale.payment_method or "").lower() != "mpesa":
            db.session.rollback()

            return jsonify({
                "error": "This sale is not configured for M-Pesa."
            }), 400

        if (sale.status or "").lower() in (
            "cancelled",
            "canceled",
        ):
            db.session.rollback()

            return jsonify({
                "error": "Cancelled sales cannot be paid."
            }), 409

        if (sale.payment_status or "").lower() == "paid":
            db.session.rollback()

            return jsonify({
                "error": "This sale has already been paid."
            }), 409

        existing_payment = db.session.execute(
            select(CashierSalePayment)
            .where(
                CashierSalePayment.sale_id == sale.id,
                CashierSalePayment.status == "pending",
            )
            .with_for_update()
        ).scalar_one_or_none()

        if existing_payment:
            db.session.rollback()

            return jsonify({
                "error": "A payment is already pending for this sale.",
                "payment_status": "pending",
            }), 409

        result = request_stk_push(
            phone=phone,
            amount=sale.total,
            account_reference=sale.sale_number,
            transaction_description="POS sale",
        )

        payment = CashierSalePayment(
            sale_id=sale.id,
            payment_method="mpesa",
            amount=Decimal(str(sale.total)),
            phone_number=phone,
            checkout_request_id=result["CheckoutRequestID"],
            merchant_request_id=result.get("MerchantRequestID"),
            status="pending",
        )

        db.session.add(payment)

        # Stock was reserved when the cashier sale was created.
        # Do not deduct stock again here.
        sale.payment_status = "unpaid"

        db.session.commit()

        return jsonify({
            "message": "Payment prompt initiated. Check your phone.",
            "sale_id": sale.id,
            "sale_number": sale.sale_number,
            "checkout_request_id": payment.checkout_request_id,
            "payment_status": "pending",
        }), 200

    except ValueError as error:
        db.session.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    except requests.RequestException:
        db.session.rollback()

        logger.exception(
            "Safaricom request failed for cashier sale."
        )

        return jsonify({
            "error": (
                "Safaricom could not be reached. "
                "Check payment status before retrying."
            )
        }), 502

    except RuntimeError as error:
        db.session.rollback()

        logger.warning(
            "Cashier STK Push was rejected: %s",
            error,
        )

        return jsonify({
            "error": "Could not initiate M-Pesa payment.",
            "details": str(error),
        }), 502

    except Exception:
        db.session.rollback()

        logger.exception("Cashier STK Push failed.")

        return jsonify({
            "error": "Payment could not be initiated."
        }), 500


# ============================================================
# SHARED SAFARICOM CALLBACK
# POST /api/payments/callback
# ============================================================

@payment_bp.route("/callback", methods=["POST"])
def mpesa_callback():
    """
    Process Safaricom STK Push callbacks.

    The checkout request ID identifies whether the callback
    belongs to a website payment or an independent cashier sale.
    """

    data = request.get_json(silent=True) or {}

    try:
        callback = data["Body"]["stkCallback"]

        checkout_request_id = callback.get("CheckoutRequestID")
        result_code = callback.get("ResultCode")
        result_description = callback.get("ResultDesc", "")

        if not checkout_request_id or result_code is None:
            return jsonify({
                "Result": "Invalid callback"
            }), 400

        try:
            result_code = int(result_code)

        except (TypeError, ValueError):
            return jsonify({
                "Result": "Invalid callback"
            }), 400

        # ----------------------------------------------------
        # IDENTIFY THE OWNING BUSINESS
        # ----------------------------------------------------
        #
        # Safaricom calls this endpoint with no shop or login, so the
        # checkout request id alone names the business. Everything
        # after this point runs scoped to that one business.

        with unscoped():
            owner_business_id = db.session.execute(
                select(Payment.business_id).where(
                    Payment.checkout_request_id
                    == checkout_request_id
                )
            ).scalar_one_or_none()

            if owner_business_id is None:
                owner_business_id = db.session.execute(
                    select(CashierSalePayment.business_id).where(
                        CashierSalePayment.checkout_request_id
                        == checkout_request_id
                    )
                ).scalar_one_or_none()

        if owner_business_id is None:
            return jsonify({
                "ResultCode": 0,
                "ResultDesc": "Accepted"
            }), 200

        set_tenant(owner_business_id)

        # ----------------------------------------------------
        # FIND THE PAYMENT RECORD
        # ----------------------------------------------------

        customer_payment = db.session.execute(
            select(Payment)
            .where(
                Payment.checkout_request_id == checkout_request_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        cashier_payment = None

        if customer_payment is None:
            cashier_payment = db.session.execute(
                select(CashierSalePayment)
                .where(
                    CashierSalePayment.checkout_request_id
                    == checkout_request_id
                )
                .with_for_update()
            ).scalar_one_or_none()

        payment = customer_payment or cashier_payment

        if payment is None:
            db.session.rollback()

            logger.warning(
                "Unknown M-Pesa checkout callback received."
            )

            return jsonify({
                "Result": "Accepted"
            }), 200

        is_cashier_payment = cashier_payment is not None

        # Safaricom may retry callbacks. Do not process a
        # terminal payment status more than once.
        if (payment.status or "").lower() in ("paid", "failed"):
            db.session.rollback()

            return jsonify({
                "Result": "Accepted"
            }), 200

        # ----------------------------------------------------
        # LOAD THE ASSOCIATED SALE OR WEBSITE ORDER
        # ----------------------------------------------------

        if is_cashier_payment:
            sale = db.session.execute(
                select(CashierSale)
                .where(CashierSale.id == payment.sale_id)
                .with_for_update()
            ).scalar_one_or_none()

            if sale is None:
                db.session.rollback()

                logger.error(
                    "Cashier payment references a missing sale."
                )

                return jsonify({
                    "Result": "Accepted"
                }), 200

            order = None

        else:
            order = db.session.execute(
                select(Order)
                .where(Order.id == payment.order_id)
                .with_for_update()
            ).scalar_one_or_none()

            if order is None:
                db.session.rollback()

                logger.error(
                    "Customer payment references a missing order."
                )

                return jsonify({
                    "Result": "Accepted"
                }), 200

            sale = None

        payment.result_description = str(
            result_description or ""
        )

        # ----------------------------------------------------
        # PAYMENT FAILED OR CANCELLED
        # ----------------------------------------------------

        if result_code != 0:
            payment.status = "failed"

            if is_cashier_payment:
                if (sale.payment_status or "").lower() != "paid":
                    restore_branch_stock_once(sale)

            else:
                if (order.payment_status or "").lower() != "paid":
                    if is_cashier_order(order):
                        restore_cashier_stock_once(order)
                    else:
                        order.payment_status = "failed"

            db.session.commit()

            logger.info(
                "M-Pesa payment failed for %s ID %s: %s",
                "cashier sale" if is_cashier_payment else "website order",
                sale.id if is_cashier_payment else order.id,
                result_description,
            )

            return jsonify({
                "Result": "Accepted"
            }), 200

        # ----------------------------------------------------
        # EXTRACT AND VALIDATE SUCCESSFUL PAYMENT DETAILS
        # ----------------------------------------------------

        receipt, callback_amount, callback_phone = (
            extract_callback_details(callback)
        )

        valid, reason = validate_callback_payment(
            payment,
            receipt,
            callback_amount,
            callback_phone,
        )

        if not valid:
            payment.result_description = (
                f"{reason} Manual verification is required."
            )

            db.session.commit()

            logger.error(
                "M-Pesa callback validation failed for payment ID %s: %s",
                payment.id,
                reason,
            )

            # Never mark a transaction paid if callback validation
            # fails.
            return jsonify({
                "Result": "Accepted"
            }), 200

        # ----------------------------------------------------
        # PREVENT DUPLICATE RECEIPTS ACROSS BOTH TABLES
        # ----------------------------------------------------

        if receipt_exists_in_any_payment_table(receipt):
            payment.result_description = (
                "Duplicate M-Pesa receipt detected. "
                "Manual verification is required."
            )

            db.session.commit()

            logger.error(
                "Duplicate M-Pesa receipt detected for payment ID %s.",
                payment.id,
            )

            return jsonify({
                "Result": "Accepted"
            }), 200

        # ----------------------------------------------------
        # CONFIRM WEBSITE ORDER PAYMENT
        # ----------------------------------------------------

        if not is_cashier_payment:
            if (order.payment_status or "").lower() == "paid":
                payment.result_description = (
                    "Order already marked paid; reconciliation required."
                )

                db.session.commit()

                return jsonify({
                    "Result": "Accepted"
                }), 200

            if (order.status or "").lower() in (
                "cancelled",
                "canceled",
            ):
                payment.result_description = (
                    "Payment succeeded after order cancellation. "
                    "Manual reconciliation is required."
                )

                db.session.commit()

                logger.error(
                    "Payment succeeded after website order %s "
                    "was cancelled.",
                    order.id,
                )

                return jsonify({
                    "Result": "Accepted"
                }), 200

            payment.status = "paid"
            payment.mpesa_receipt_number = str(receipt)

            order.payment_status = "paid"

            # Preserve support for historical cashier transactions
            # stored as website orders.
            if is_cashier_order(order):
                order.status = "completed"

                order.notes = (
                    f"{order.notes or ''}\n"
                    f"M-Pesa payment confirmed. Receipt: {receipt}."
                )

        # ----------------------------------------------------
        # CONFIRM INDEPENDENT CASHIER POS SALE PAYMENT
        # ----------------------------------------------------

        else:
            if (sale.payment_status or "").lower() == "paid":
                payment.result_description = (
                    "Sale already marked paid; reconciliation required."
                )

                db.session.commit()

                return jsonify({
                    "Result": "Accepted"
                }), 200

            if (sale.status or "").lower() in (
                "cancelled",
                "canceled",
            ):
                payment.result_description = (
                    "Payment succeeded after sale cancellation. "
                    "Manual reconciliation is required."
                )

                db.session.commit()

                logger.error(
                    "Payment succeeded after cashier sale %s "
                    "was cancelled.",
                    sale.id,
                )

                return jsonify({
                    "Result": "Accepted"
                }), 200

            payment.status = "paid"
            payment.mpesa_receipt_number = str(receipt)

            sale.payment_status = "paid"
            sale.status = "completed"

        # ----------------------------------------------------
        # COMMIT SUCCESSFUL PAYMENT
        # ----------------------------------------------------

        db.session.commit()

        logger.info(
            "M-Pesa payment confirmed for %s ID %s.",
            "cashier sale" if is_cashier_payment else "website order",
            sale.id if is_cashier_payment else order.id,
        )

        return jsonify({
            "Result": "Accepted"
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Failed to process M-Pesa callback."
        )

        # Acknowledge the callback and investigate processing
        # errors through server logs and reconciliation.
        return jsonify({
            "Result": "Accepted"
        }), 200


# ============================================================
# CUSTOMER WEBSITE PAYMENT STATUS
# GET /api/payments/status/<order_id>
# ============================================================

@payment_bp.route("/status/<int:order_id>", methods=["GET"])
@shop_context_required
def customer_payment_status(order_id):
    """
    Return payment status for a website order only.
    """

    try:
        order = db.session.get(Order, order_id)

        if not order:
            return jsonify({
                "error": "Order not found."
            }), 404

        if is_cashier_order(order):
            return jsonify({
                "error": "Use the cashier payment-status endpoint."
            }), 403

        payment = db.session.execute(
            select(Payment)
            .where(Payment.order_id == order.id)
            .order_by(Payment.id.desc())
        ).scalars().first()

        order_payment_status = (
            order.payment_status or ""
        ).lower()

        if order_payment_status == "paid":
            if payment and (payment.status or "").lower() == "paid":
                return jsonify({
                    "order_id": order.id,
                    "payment_status": "paid",
                    "transaction_status": "paid",
                    "message": "Payment confirmed successfully.",
                    "receipt": payment.mpesa_receipt_number,
                }), 200

            return jsonify({
                "order_id": order.id,
                "payment_status": "pending",
                "transaction_status": "pending",
                "message": "Payment is awaiting verification.",
            }), 200

        if not payment:
            return jsonify({
                "order_id": order.id,
                "payment_status": order.payment_status,
                "transaction_status": "not_initiated",
                "message": "No M-Pesa payment attempt was found.",
            }), 200

        payment_status = (payment.status or "").lower()

        if payment_status == "paid":
            return jsonify({
                "order_id": order.id,
                "payment_status": "pending",
                "transaction_status": "pending",
                "message": "Payment is awaiting order verification.",
            }), 200

        if payment_status == "failed":
            return jsonify({
                "order_id": order.id,
                "payment_status": "failed",
                "transaction_status": "failed",
                "message": (
                    payment.result_description
                    or "M-Pesa payment failed. Please try again."
                ),
            }), 200

        return jsonify({
            "order_id": order.id,
            "payment_status": "pending",
            "transaction_status": "pending",
            "message": (
                payment.result_description
                or "Waiting for M-Pesa payment confirmation."
            ),
        }), 200

    except Exception:
        logger.exception(
            "Failed to retrieve customer payment status for order %s.",
            order_id,
        )

        return jsonify({
            "error": "Could not retrieve payment status."
        }), 500