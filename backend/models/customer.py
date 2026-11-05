from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models.tenant import TenantMixin


class Customer(TenantMixin, db.Model):
    __tablename__ = "customers"

    __table_args__ = (
        db.UniqueConstraint(
            "business_id", "phone", name="uq_customer_business_phone"
        ),
        db.UniqueConstraint(
            "business_id", "email", name="uq_customer_business_email"
        ),
    )

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=False
    )

    email = db.Column(
        db.String(150)
    )

    password_hash = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    orders = db.relationship(
        "Order",
        back_populates="customer"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password
        )

    def check_password(self, password):
        if not self.password_hash:
            return False

        return check_password_hash(
            self.password_hash,
            password
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
        }