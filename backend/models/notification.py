
from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class Notification(TenantMixin, db.Model):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Customer who receives the notification
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False
    )

    type = db.Column(
        db.String(50),
        nullable=False
    )

    title = db.Column(
        db.String(150),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    # Optional ID of the related order/message/etc.
    related_id = db.Column(
        db.Integer,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    customer = db.relationship(
        "Customer",
        backref=db.backref(
            "notifications",
            lazy=True
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "related_id": self.related_id,
            "created_at": self.created_at.isoformat() + "Z",
        }
