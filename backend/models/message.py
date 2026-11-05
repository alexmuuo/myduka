from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class Message(TenantMixin, db.Model):
    __tablename__ = "messages"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False,
        index=True
    )

    sender = db.Column(
        db.String(20),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
        index=True
    )

    # Time the message was created by the sender.
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Time the recipient's interface retrieved the message.
    # None means delivery has not yet been recorded.
    delivered_at = db.Column(
        db.DateTime,
        nullable=True
    )

    customer = db.relationship(
        "Customer",
        backref=db.backref(
            "messages",
            lazy=True
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,

            "customer": (
                self.customer.to_dict()
                if self.customer
                else None
            ),

            "sender": self.sender,
            "message": self.message,

            "is_read": bool(self.is_read),

            "created_at": (
                self.created_at.isoformat() + "Z"
                if self.created_at
                else None
            ),

            "delivered_at": (
                self.delivered_at.isoformat() + "Z"
                if self.delivered_at
                else None
            ),
        }