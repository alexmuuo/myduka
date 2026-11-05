from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class CashCollection(TenantMixin, db.Model):
    __tablename__ = "cash_collections"

    # Primary key
    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # One cash collection per order
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False,
        unique=True,
        index=True
    )

    # Amount collected
    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    # Payment method
    method = db.Column(
        db.String(20),
        nullable=False,
        default="cash"
    )

    # Admin who confirmed payment
    confirmed_by = db.Column(
        db.String(100),
        nullable=False
    )

    # Optional audit notes
    notes = db.Column(
        db.Text,
        nullable=True
    )

    # Confirmation timestamp
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationship to the order
    order = db.relationship(
        "Order",
        backref=db.backref(
            "cash_collection",
            uselist=False
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "amount": float(self.amount),
            "method": self.method,
            "confirmed_by": self.confirmed_by,
            "notes": self.notes,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }