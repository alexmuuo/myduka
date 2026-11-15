from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


EAT = timezone(timedelta(hours=3), "EAT")


def _utcnow():
    return datetime.now(timezone.utc)


class StockMovement(db.Model):
    __tablename__ = "stock_movements"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    branch_id = db.Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    product_id = db.Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    movement_type = db.Column(
        db.Text,
        nullable=False,
        index=True
    )

    previous_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    quantity_changed = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    new_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    reference = db.Column(
        db.Text,
        nullable=True
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    performed_by = db.Column(
        UUID(as_uuid=True),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        default=_utcnow,
        server_default=db.func.now(),
        index=True
    )

    branch = db.relationship("Branch")
    product = db.relationship("Product")

    __table_args__ = (
        db.ForeignKeyConstraint(
            ["branch_id", "business_id"],
            ["branches.id", "branches.business_id"],
            name="stock_movements_branch_business_fk"
        ),
        db.ForeignKeyConstraint(
            ["product_id", "business_id"],
            ["products.id", "products.business_id"],
            name="stock_movements_product_business_fk"
        ),
        db.ForeignKeyConstraint(
            ["branch_id", "product_id"],
            [
                "branch_product_stock.branch_id",
                "branch_product_stock.product_id"
            ],
            name="stock_movements_branch_product_fk"
        ),
        db.CheckConstraint(
            "previous_stock >= 0",
            name="ck_stock_movement_previous_stock_nonnegative"
        ),
        db.CheckConstraint(
            "quantity_changed > 0",
            name="ck_stock_movement_quantity_positive"
        ),
        db.CheckConstraint(
            "new_stock >= 0",
            name="ck_stock_movement_new_stock_nonnegative"
        ),
    )

    def _created_at_eat(self):
        if self.created_at is None:
            return None

        created_at = self.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        return created_at.astimezone(EAT)

    def to_dict(self):
        created_at_eat = self._created_at_eat()

        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "branch_id": str(self.branch_id),
            "product_id": str(self.product_id),
            "product_name": (
                self.product.name if self.product else None
            ),
            "movement_type": self.movement_type,
            "previous_stock": float(self.previous_stock),
            "quantity_changed": float(self.quantity_changed),
            "new_stock": float(self.new_stock),
            "reference": self.reference,
            "notes": self.notes,
            "performed_by": (
                str(self.performed_by)
                if self.performed_by
                else None
            ),
            "created_at": (
                created_at_eat.isoformat()
                if created_at_eat
                else None
            )
        }
