import hashlib
import logging
import os

from urllib.parse import urlencode

from flask import (
    Blueprint,
    jsonify,
    request,
    current_app,
)

from flask_mail import Message

from itsdangerous import (
    URLSafeTimedSerializer,
    BadSignature,
    SignatureExpired,
)

from extensions import db
from models.customer import Customer
from customer_auth import create_customer_token
from flask import g
from tenancy import shop_context_required


customer_bp = Blueprint(
    "customer_bp",
    __name__
)

logger = logging.getLogger(__name__)


# =========================================================
# PASSWORD RESET CONFIGURATION
# =========================================================

PASSWORD_RESET_TOKEN_MAX_AGE = 30 * 60  # 30 minutes


def get_password_reset_serializer():
    """
    Return the dedicated password-reset token serializer.
    """

    secret = os.environ.get("CUSTOMER_TOKEN_SECRET")

    if not secret:
        raise RuntimeError(
            "CUSTOMER_TOKEN_SECRET is not configured."
        )

    return URLSafeTimedSerializer(
        secret,
        salt="myduka-customer-password-reset"
    )


def get_password_hash_fingerprint(customer):
    """
    Generate a fingerprint of the current password hash.

    The actual password hash is never included in the
    reset token payload.

    When the customer's password changes, this fingerprint
    changes, invalidating previously issued reset tokens.
    """

    if not customer.password_hash:
        return None

    return hashlib.sha256(
        customer.password_hash.encode("utf-8")
    ).hexdigest()


def create_password_reset_token(customer):
    """
    Create a signed password-reset token.

    The token is tied to the customer's current password
    hash fingerprint so that changing the password
    invalidates previously issued tokens.
    """

    if not customer.password_hash:
        raise ValueError(
            "Customer does not have a password to reset."
        )

    serializer = get_password_reset_serializer()

    return serializer.dumps({
        "customer_id": customer.id,
        "purpose": "password_reset",
        "password_fingerprint": (
            get_password_hash_fingerprint(customer)
        ),
    })


def verify_password_reset_token(token):
    """
    Verify a reset token and retrieve its customer.

    Returns:
        (customer, None) on success.
        (None, "expired") if the token has expired.
        (None, "invalid") if the token is invalid.
    """

    serializer = get_password_reset_serializer()

    try:
        payload = serializer.loads(
            token,
            max_age=PASSWORD_RESET_TOKEN_MAX_AGE
        )

    except SignatureExpired:
        return None, "expired"

    except BadSignature:
        return None, "invalid"

    if not isinstance(payload, dict):
        return None, "invalid"

    if payload.get("purpose") != "password_reset":
        return None, "invalid"

    customer_id = payload.get("customer_id")

    if type(customer_id) is not int:
        return None, "invalid"

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer or not customer.password_hash:
        return None, "invalid"

    token_fingerprint = payload.get(
        "password_fingerprint"
    )

    current_fingerprint = (
        get_password_hash_fingerprint(customer)
    )

    # Reject tokens created before the current password
    # hash was established or changed.
    if (
        not isinstance(token_fingerprint, str)
        or not isinstance(current_fingerprint, str)
        or token_fingerprint != current_fingerprint
    ):
        return None, "invalid"

    return customer, None


def send_password_reset_email(customer, reset_url):
    """
    Send a password-reset email using Flask-Mail.
    """

    mail = current_app.extensions.get("mail")

    if mail is None:
        raise RuntimeError(
            "Flask-Mail has not been initialized."
        )

    message = Message(
        subject="Reset Your Password",
        recipients=[customer.email],
        body=(
            f"Hello {customer.name},\n\n"
            "We received a request to reset your MyDuka "
            "account password.\n\n"
            "Use the following link to choose a new password:\n\n"
            f"{reset_url}\n\n"
            "This link expires in 30 minutes and can only "
            "be used while your existing password remains "
            "unchanged.\n\n"
            "If you did not request a password reset, "
            "you can safely ignore this email.\n\n"
            "For your security, do not share this link "
            "with anyone.\n\n"
            "MyDuka Team"
        ),
    )

    mail.send(message)


# =========================================================
# CREATE OR RETRIEVE CUSTOMER
# =========================================================

@customer_bp.route(
    "/api/customers",
    methods=["POST"]
)
@shop_context_required
def create_or_get_customer():
    """
    Create a customer record or retrieve an existing
    customer using their phone number.

    This endpoint is retained for compatibility with
    existing frontend functionality.
    """

    try:
        data = request.get_json(silent=True) or {}

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")

        # -------------------------------------------------
        # VALIDATE INPUT
        # -------------------------------------------------

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "status": "error",
                "message": "Name is required."
            }), 400

        if not isinstance(phone, str) or not phone.strip():
            return jsonify({
                "status": "error",
                "message": "Phone number is required."
            }), 400

        name = name.strip()
        phone = phone.strip()

        if email is not None:
            if not isinstance(email, str):
                return jsonify({
                    "status": "error",
                    "message": "Invalid email address."
                }), 400

            email = email.strip().lower() or None

        # -------------------------------------------------
        # FIND EXISTING CUSTOMER BY PHONE
        # -------------------------------------------------

        customer = Customer.query.filter_by(
            phone=phone
        ).first()

        if customer:

            # Prevent assigning an email already owned
            # by another customer.
            if email:
                email_owner = Customer.query.filter(
                    db.func.lower(Customer.email) == email,
                    Customer.id != customer.id
                ).first()

                if email_owner:
                    return jsonify({
                        "status": "error",
                        "message": (
                            "This email is already registered "
                            "to another customer."
                        )
                    }), 400

            customer.name = name

            if email:
                customer.email = email

            db.session.commit()

            return jsonify({
                "status": "success",
                "message": "Customer found.",
                "customer": customer.to_dict()
            }), 200

        # -------------------------------------------------
        # CHECK EMAIL BEFORE CREATING CUSTOMER
        # -------------------------------------------------

        if email:
            email_owner = Customer.query.filter(
                db.func.lower(Customer.email) == email
            ).first()

            if email_owner:
                return jsonify({
                    "status": "error",
                    "message": (
                        "This email is already registered "
                        "to another customer."
                    )
                }), 400

        # -------------------------------------------------
        # CREATE CUSTOMER
        # -------------------------------------------------

        customer = Customer(
            name=name,
            phone=phone,
            email=email
        )

        db.session.add(customer)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Customer created successfully.",
            "customer": customer.to_dict()
        }), 201

    except Exception:
        db.session.rollback()

        logger.exception(
            "Customer creation or lookup failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to process the customer request."
        }), 500


# =========================================================
# CUSTOMER REGISTRATION
# =========================================================

@customer_bp.route(
    "/api/customers/register",
    methods=["POST"]
)
@shop_context_required
def register_customer():
    """
    Register a customer or allow an existing customer
    without a password to finish creating their account.
    """

    try:
        data = request.get_json(silent=True) or {}

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")
        password = data.get("password")

        # -------------------------------------------------
        # VALIDATE REQUIRED FIELDS
        # -------------------------------------------------

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "status": "error",
                "message": "Name is required."
            }), 400

        if not isinstance(phone, str) or not phone.strip():
            return jsonify({
                "status": "error",
                "message": "Phone number is required."
            }), 400

        if not isinstance(password, str) or not password:
            return jsonify({
                "status": "error",
                "message": "Password is required."
            }), 400

        if len(password) < 6:
            return jsonify({
                "status": "error",
                "message": (
                    "Password must be at least 6 characters."
                )
            }), 400

        name = name.strip()
        phone = phone.strip()

        if email is not None:
            if not isinstance(email, str):
                return jsonify({
                    "status": "error",
                    "message": "Invalid email address."
                }), 400

            email = email.strip().lower() or None

        # -------------------------------------------------
        # CHECK EXISTING PHONE NUMBER
        # -------------------------------------------------

        customer = Customer.query.filter_by(
            phone=phone
        ).first()

        if customer:

            # An account with an existing password must
            # use the normal login process.
            if customer.password_hash:
                return jsonify({
                    "status": "error",
                    "message": (
                        "A customer with this phone number "
                        "already has an account."
                    )
                }), 400

            # Prevent assigning an email owned by another
            # customer.
            if email:
                email_owner = Customer.query.filter(
                    db.func.lower(Customer.email) == email,
                    Customer.id != customer.id
                ).first()

                if email_owner:
                    return jsonify({
                        "status": "error",
                        "message": (
                            "This email is already registered "
                            "to another customer."
                        )
                    }), 400

                customer.email = email

            # Finish creating the existing customer's
            # account without creating another record.
            customer.name = name
            customer.set_password(password)

            db.session.commit()

            logger.info(
                "Account created for existing customer_id=%s",
                customer.id
            )

            return jsonify({
                "status": "success",
                "message": "Account created successfully.",
                "customer": customer.to_dict()
            }), 201

        # -------------------------------------------------
        # CHECK EMAIL BEFORE CREATING NEW ACCOUNT
        # -------------------------------------------------

        if email:
            email_owner = Customer.query.filter(
                db.func.lower(Customer.email) == email
            ).first()

            if email_owner:
                return jsonify({
                    "status": "error",
                    "message": (
                        "This email is already registered "
                        "to another customer."
                    )
                }), 400

        # -------------------------------------------------
        # CREATE NEW CUSTOMER ACCOUNT
        # -------------------------------------------------

        customer = Customer(
            name=name,
            phone=phone,
            email=email
        )

        customer.set_password(password)

        db.session.add(customer)
        db.session.commit()

        logger.info(
            "Customer registered successfully: customer_id=%s",
            customer.id
        )

        return jsonify({
            "status": "success",
            "message": "Account created successfully.",
            "customer": customer.to_dict()
        }), 201

    except Exception:
        db.session.rollback()

        logger.exception(
            "Customer registration failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to complete registration."
        }), 500


# =========================================================
# CUSTOMER LOGIN
# =========================================================

@customer_bp.route(
    "/api/customers/login",
    methods=["POST"]
)
@shop_context_required
def login_customer():
    """
    Authenticate a customer using their phone number
    and password.
    """

    try:
        data = request.get_json(silent=True) or {}

        phone = data.get("phone")
        password = data.get("password")

        # -------------------------------------------------
        # VALIDATE INPUT
        # -------------------------------------------------

        if not isinstance(phone, str) or not phone.strip():
            return jsonify({
                "status": "error",
                "message": "Phone number is required."
            }), 400

        if not isinstance(password, str) or not password:
            return jsonify({
                "status": "error",
                "message": "Password is required."
            }), 400

        phone = phone.strip()

        # -------------------------------------------------
        # FIND CUSTOMER
        # -------------------------------------------------

        customer = Customer.query.filter_by(
            phone=phone
        ).first()

        if not customer:
            return jsonify({
                "status": "error",
                "message": "Invalid phone number or password."
            }), 401

        if not customer.password_hash:
            return jsonify({
                "status": "error",
                "message": (
                    "This account does not have a password yet. "
                    "Please create an account first."
                )
            }), 401

        # -------------------------------------------------
        # VERIFY PASSWORD
        # -------------------------------------------------

        if not customer.check_password(password):
            return jsonify({
                "status": "error",
                "message": "Invalid phone number or password."
            }), 401

        # -------------------------------------------------
        # GENERATE CUSTOMER AUTHENTICATION TOKEN
        # -------------------------------------------------

        token = create_customer_token(customer)

        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "token": token,
            "customer": customer.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Customer login failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to process login."
        }), 500


# =========================================================
# CUSTOMER FORGOT PASSWORD
# =========================================================

@customer_bp.route(
    "/api/customers/forgot-password",
    methods=["POST"]
)
@shop_context_required
def forgot_customer_password():
    """
    Request a password-reset email.

    A generic success response prevents the endpoint
    from revealing whether an email is registered.
    """

    data = request.get_json(silent=True) or {}

    email = data.get("email")

    # -----------------------------------------------------
    # VALIDATE EMAIL
    # -----------------------------------------------------

    if not isinstance(email, str) or not email.strip():
        return jsonify({
            "status": "error",
            "message": "Please provide a valid email address."
        }), 400

    email = email.strip().lower()

    try:
        # -------------------------------------------------
        # FIND ELIGIBLE CUSTOMER
        # -------------------------------------------------

        customer = Customer.query.filter(
            db.func.lower(Customer.email) == email
        ).first()

        # Return the same message regardless of whether
        # an eligible account exists.
        if not customer or not customer.password_hash:
            return jsonify({
                "status": "success",
                "message": (
                    "If an eligible account exists for that email, "
                    "a password-reset link will be sent."
                )
            }), 200

        # -------------------------------------------------
        # GENERATE RESET TOKEN
        # -------------------------------------------------

        token = create_password_reset_token(customer)

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")

        query_string = urlencode({
            "token": token
        })

        # The link is shop-specific so the reset page talks to the
        # right business.
        reset_url = (
            f"{frontend_url}/shop/{g.business.slug}"
            f"/reset-password?{query_string}"
        )

        # -------------------------------------------------
        # SEND RESET EMAIL
        # -------------------------------------------------

        send_password_reset_email(
            customer,
            reset_url
        )

        logger.info(
            "Password-reset email sent for customer_id=%s",
            customer.id
        )

        return jsonify({
            "status": "success",
            "message": (
                "If an eligible account exists for that email, "
                "a password-reset link will be sent."
            )
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Unable to send customer password-reset email."
        )

        return jsonify({
            "status": "error",
            "message": (
                "We could not process your request right now. "
                "Please try again later."
            )
        }), 500


# =========================================================
# CUSTOMER RESET PASSWORD
# =========================================================

@customer_bp.route(
    "/api/customers/reset-password",
    methods=["POST"]
)
@shop_context_required
def reset_customer_password():
    """
    Verify a password-reset token and update the customer's
    password.

    Successful password changes invalidate previously
    issued reset tokens.
    """

    data = request.get_json(silent=True) or {}

    token = data.get("token")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    # -----------------------------------------------------
    # VALIDATE INPUT
    # -----------------------------------------------------

    if not isinstance(token, str) or not token.strip():
        return jsonify({
            "status": "error",
            "message": "Password-reset token is required."
        }), 400

    if not isinstance(password, str) or not password:
        return jsonify({
            "status": "error",
            "message": "New password is required."
        }), 400

    if len(password) < 6:
        return jsonify({
            "status": "error",
            "message": (
                "Password must be at least 6 characters."
            )
        }), 400

    if not isinstance(confirm_password, str):
        return jsonify({
            "status": "error",
            "message": "Please confirm your new password."
        }), 400

    if password != confirm_password:
        return jsonify({
            "status": "error",
            "message": "Passwords do not match."
        }), 400

    try:
        # -------------------------------------------------
        # VERIFY TOKEN
        # -------------------------------------------------

        customer, token_error = verify_password_reset_token(
            token.strip()
        )

        if token_error == "expired":
            return jsonify({
                "status": "error",
                "message": (
                    "This password-reset link has expired. "
                    "Please request a new one."
                )
            }), 400

        if token_error or not customer:
            return jsonify({
                "status": "error",
                "message": (
                    "This password-reset link is invalid or "
                    "has already been used. Please request "
                    "a new one."
                )
            }), 400

        # -------------------------------------------------
        # SAVE NEW PASSWORD
        # -------------------------------------------------

        customer.set_password(password)

        db.session.commit()

        # -------------------------------------------------
        # VERIFY SAVED PASSWORD
        # -------------------------------------------------

        db.session.refresh(customer)

        if not customer.check_password(password):
            logger.error(
                "Saved password verification failed "
                "for customer_id=%s",
                customer.id
            )

            return jsonify({
                "status": "error",
                "message": (
                    "The password could not be verified "
                    "after saving. Please try again."
                )
            }), 500

        # The password hash has changed. Consequently,
        # previously issued reset tokens will no longer
        # match the customer's current password fingerprint.

        logger.info(
            "Customer password reset successfully: customer_id=%s",
            customer.id
        )

        return jsonify({
            "status": "success",
            "message": (
                "Password reset successfully. "
                "You can now log in with your new password."
            )
        }), 200

    except Exception:
        db.session.rollback()

        logger.exception(
            "Customer password reset failed."
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to reset your password right now. "
                "Please try again later."
            )
        }), 500