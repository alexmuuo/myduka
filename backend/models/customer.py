from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
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

    # A customer account belongs to one business shop. The same person
    # registering at another shop gets a separate account.
    __table_args__ = (
        db.UniqueConstraint(
            "business_id", "phone",
            name="uq_customers_business_phone"
        ),
        db.UniqueConstraint(
            "business_id", "email",
            name="uq_customers_business_email"
        ),
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