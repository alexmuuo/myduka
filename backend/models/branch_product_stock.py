from datetime import datetime
from decimal import Decimal

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class BranchProductStock(db.Model):
    __tablename__ = "branch_product_stock"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        nullable=False
    )

    branch_id = db.Column(
        UUID(as_uuid=True),
        nullable=False
    )

    product_id = db.Column(
        UUID(as_uuid=True),
        nullable=False
    )

    quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False,
        default=Decimal("0.000"),
        server_default="0"
    )

    reorder_level = db.Column(
        db.Numeric(12, 3),
        nullable=True,
        default=Decimal("0.000"),
        server_default="0"
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    branch = db.relationship("Branch")
    product = db.relationship("Product")

    __table_args__ = (
        db.ForeignKeyConstraint(
            ["branch_id", "business_id"],
            ["branches.id", "branches.business_id"],
            name="stock_branch_business_fk",
            ondelete="CASCADE"
        ),
        db.ForeignKeyConstraint(
            ["product_id", "business_id"],
            ["products.id", "products.business_id"],
            name="stock_product_business_fk",
            ondelete="CASCADE"
        ),
        db.UniqueConstraint(
            "branch_id",
            "product_id",
            name="uq_branch_product_stock"
        ),
        db.CheckConstraint(
            "quantity >= 0",
            name="ck_branch_stock_nonnegative"
        ),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "branch_id": str(self.branch_id),
            "product_id": str(self.product_id),
            "product_name": (
                self.product.name if self.product else None
            ),
            "quantity": (
                float(self.quantity)
                if self.quantity is not None
                else 0.0
            ),
            "reorder_level": (
                float(self.reorder_level)
                if self.reorder_level is not None
                else 0.0
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }
