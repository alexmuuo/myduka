import os
from functools import wraps

from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from admin_auth import password_version
from extensions import db
from models.business import Business
from models.customer import Customer
from tenancy import (
    business_is_open,
    resolve_shop_from_request,
    set_tenant,
    unscoped,
)


CUSTOMER_TOKEN_MAX_AGE = 60 * 60 * 24  # 24 hours
TOKEN_SALT = "myduka-customer-auth"


def get_customer_token_serializer():
    secret = os.environ.get("CUSTOMER_TOKEN_SECRET")

    if not secret or not secret.strip():
        raise RuntimeError("CUSTOMER_TOKEN_SECRET is not configured")

    return URLSafeTimedSerializer(secret, salt=TOKEN_SALT)


def create_customer_token(customer):
    return get_customer_token_serializer().dumps({
        "k": "customer",
        "customer_id": customer.id,
        "pv": password_version(customer.password_hash),
    })


def _error(message, status):
    return jsonify({"status": "error", "message": message}), status


def customer_required(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        parts = request.headers.get("Authorization", "").split()

        if (
            len(parts) != 2
            or parts[0].lower() != "bearer"
            or not parts[1]
        ):
            return _error("Customer authentication required", 401)

        try:
            payload = get_customer_token_serializer().loads(
                parts[1], max_age=CUSTOMER_TOKEN_MAX_AGE
            )

        except SignatureExpired:
            return _error(
                "Customer session has expired. Please log in again.", 401
            )

        except (BadSignature, ValueError, TypeError):
            return _error("Invalid customer token", 401)

        except RuntimeError:
            return _error("Customer authentication is not configured", 500)

        customer_id = (
            payload.get("customer_id")
            if isinstance(payload, dict)
            else None
        )

        if (
            not isinstance(payload, dict)
            or payload.get("k") != "customer"
            or not isinstance(customer_id, int)
            or isinstance(customer_id, bool)
        ):
            return _error("Invalid customer token", 401)

        # The customer row decides the tenant, so this lookup is
        # deliberately unscoped.
        try:
            with unscoped():
                customer = db.session.get(Customer, customer_id)

            business = (
                db.session.get(Business, customer.business_id)
                if customer is not None
                else None
            )

        except Exception:
            db.session.rollback()
            return _error("Unable to verify customer session", 503)

        if (
            customer is None
            or payload.get("pv") != password_version(customer.password_hash)
        ):
            return _error("Customer account not found", 401)

        if not business_is_open(business):
            return _error("This shop is not available", 403)

        # A token from one shop must not work on another shop.
        requested_shop = resolve_shop_from_request()

        if (
            requested_shop is not None
            and requested_shop.id != customer.business_id
        ):
            return _error("Please log in to this shop", 403)

        g.customer = customer
        g.business = business
        set_tenant(customer.business_id)

        return view_function(*args, **kwargs)

    return decorated_function


def identify_customer_from_token():
    """Return the customer named by a valid bearer token, else None.

    Used by public routes that behave differently for logged-in
    customers. The result is only trustworthy after the shop context
    is set, because lookups are tenant-scoped.
    """
    parts = request.headers.get("Authorization", "").split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    try:
        payload = get_customer_token_serializer().loads(
            parts[1], max_age=CUSTOMER_TOKEN_MAX_AGE
        )

    except (BadSignature, ValueError, TypeError, RuntimeError):
        return None

    customer_id = (
        payload.get("customer_id") if isinstance(payload, dict) else None
    )

    if (
        payload.get("k") != "customer"
        or not isinstance(customer_id, int)
        or isinstance(customer_id, bool)
    ):
        return None

    customer = db.session.get(Customer, customer_id)

    if customer is None or payload.get("pv") != password_version(
        customer.password_hash
    ):
        return None

    return customer
