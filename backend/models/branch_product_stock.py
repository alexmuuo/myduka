from datetime import datetime
from decimal import Decimal

from extensions import db
from models.tenant import TenantMixin


class BranchProductStock(TenantMixin, db.Model):
    __tablename__ = "branch_product_stock"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False
    )

    quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False,
        default=Decimal("0.000")
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    branch = db.relationship(
        "Branch",
        back_populates="stock_items"
    )

    product = db.relationship(
        "Product"
    )

    __table_args__ = (
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
            "id": self.id,
            "branch_id": self.branch_id,
            "product_id": self.product_id,
            "product_name": (
                self.product.name
                if self.product
                else None
            ),
            "quantity": (
                float(self.quantity)
                if self.quantity is not None
                else 0.0
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }

