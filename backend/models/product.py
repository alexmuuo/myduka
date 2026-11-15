from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    category_id = db.Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    name = db.Column(
        db.Text,
        nullable=False
    )

    sku = db.Column(
        db.Text,
        nullable=True
    )

    barcode = db.Column(
        db.Text,
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    image_url = db.Column(
        db.Text,
        nullable=True
    )

    unit = db.Column(
        db.Text,
        nullable=False,
        default="piece",
        server_default="piece"
    )

    buying_price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0"
    )

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0"
    )

    allow_portion_sales = db.Column(
        db.Boolean,
        nullable=True,
        default=False,
        server_default=db.false()
    )

    portions_per_unit = db.Column(
        db.Numeric(12, 3),
        nullable=True
    )

    portion_price = db.Column(
        db.Numeric(12, 2),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        nullable=True,
        default=True,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now(),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint(
            "id",
            "business_id",
            name="products_id_business_id_key"
        ),
        db.CheckConstraint(
            "buying_price >= 0",
            name="ck_products_buying_price_nonnegative"
        ),
        db.CheckConstraint(
            "price >= 0",
            name="ck_products_price_nonnegative"
        ),
        db.CheckConstraint(
            "portions_per_unit IS NULL OR portions_per_unit > 0",
            name="ck_products_portions_per_unit_positive"
        ),
        db.CheckConstraint(
            "portion_price IS NULL OR portion_price >= 0",
            name="ck_products_portion_price_nonnegative"
        ),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "category_id": (
                str(self.category_id)
                if self.category_id
                else None
            ),
            "name": self.name,
            "sku": self.sku,
            "barcode": self.barcode,
            "description": self.description,
            "image_url": self.image_url,
            "unit": self.unit,
            "buying_price": float(self.buying_price or 0),
            "price": float(self.price or 0),
            "allow_portion_sales": bool(
                self.allow_portion_sales
            ),
            "portions_per_unit": (
                float(self.portions_per_unit)
                if self.portions_per_unit is not None
                else None
            ),
            "portion_price": (
                float(self.portion_price)
                if self.portion_price is not None
                else None
            ),
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }
