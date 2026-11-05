from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class CashierSalePayment(TenantMixin, db.Model):
    __tablename__ = "cashier_sale_payments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sale_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "cashier_sales.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    payment_method = db.Column(
        db.String(30),
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

    phone_number = db.Column(
        db.String(20),
        nullable=True
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

    result_description = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    sale = db.relationship(
        "CashierSale",
        back_populates="payments"
    )

    __table_args__ = (
        db.CheckConstraint(
            "amount > 0",
            name="ck_cashier_sale_payment_amount_positive"
        ),
    )