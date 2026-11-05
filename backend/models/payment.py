from datetime import datetime
from extensions import db
from models.tenant import TenantMixin


class Payment(TenantMixin, db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    checkout_request_id = db.Column(
        db.String(100),
        unique=True,
        nullable=True
    )

    merchant_request_id = db.Column(
        db.String(100),
        nullable=True
    )

    mpesa_receipt_number = db.Column(
        db.String(50),
        unique=True,
        nullable=True
    )

    phone_number = db.Column(
        db.String(20),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    result_description = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )