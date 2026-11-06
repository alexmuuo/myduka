from datetime import datetime
from decimal import Decimal

from extensions import db


class Product(db.Model):
    __tablename__ = "products"

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

    category = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    # Cost paid by the business to acquire one stock unit.
    buying_price = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    # Existing customer-facing selling price per stock unit.
    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    unit = db.Column(
        db.String(50),
        nullable=False
    )

    # Decimal-capable global stock.
    # Branch inventory remains separately tracked.
    stock = db.Column(
        db.Numeric(12, 3),
        nullable=False,
        default=Decimal("0.000")
    )

    # Selling portions configuration.
    # Example: one bottle can be sold as four portions.
    allow_portion_sales = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default=db.false()
    )

    portions_per_unit = db.Column(
        db.Integer,
        nullable=True
    )

    portion_price = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    image = db.Column(
        db.String(500)
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.CheckConstraint(
            """
            portions_per_unit IS NULL
            OR portions_per_unit > 0
            """,
            name="ck_product_portions_per_unit_positive"
        ),
        db.CheckConstraint(
            """
            portion_price IS NULL
            OR portion_price >= 0
            """,
            name="ck_product_portion_price_nonnegative"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "buying_price": (
                float(self.buying_price)
                if self.buying_price is not None
                else None
            ),
            "price": float(self.price),
            "unit": self.unit,
            "stock": (
                float(self.stock)
                if self.stock is not None
                else 0.0
            ),
            "allow_portion_sales": self.allow_portion_sales,
            "portions_per_unit": self.portions_per_unit,
            "portion_price": (
                float(self.portion_price)
                if self.portion_price is not None
                else None
            ),
            "image": self.image,
            "is_active": self.is_active,
        }

