from datetime import datetime, timedelta, timezone

from extensions import db


EAT = timezone(timedelta(hours=3), "EAT")


def _utcnow():
    return datetime.now(timezone.utc)


class StockMovement(db.Model):
    __tablename__ = "stock_movements"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Cashier movements retain their cashier ID.
    # Administrator movements do not need a fake cashier.
    cashier_id = db.Column(
        db.Integer,
        db.ForeignKey("cashiers.id"),
        nullable=True,
        index=True
    )

    admin_username = db.Column(
        db.String(100),
        nullable=True
    )

    movement_type = db.Column(
        db.String(20),
        nullable=False,
        default="STOCK_IN",
        server_default="STOCK_IN",
        index=True
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    product_name = db.Column(
        db.String(255),
        nullable=False
    )

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id"),
        nullable=False,
        index=True
    )

    previous_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    quantity_added = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    new_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    reference = db.Column(
        db.String(100),
        nullable=True,
        index=True
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        index=True
    )

    cashier = db.relationship(
        "Cashier",
        backref=db.backref("stock_movements", lazy=True)
    )

    product = db.relationship(
        "Product",
        backref=db.backref("stock_movements", lazy=True)
    )

    branch = db.relationship(
        "Branch",
        backref=db.backref("stock_movements", lazy=True)
    )

    __table_args__ = (
        db.CheckConstraint(
            "quantity_added > 0",
            name="ck_stock_movement_quantity_added_positive"
        ),

        db.CheckConstraint(
            "previous_stock >= 0",
            name="ck_stock_movement_previous_stock_nonnegative"
        ),

        db.CheckConstraint(
            "new_stock >= 0",
            name="ck_stock_movement_new_stock_nonnegative"
        ),

        db.CheckConstraint(
            """
            (
                movement_type = 'TRANSFER_OUT'
                AND new_stock = previous_stock - quantity_added
            )
            OR
            (
                movement_type IN ('STOCK_IN', 'TRANSFER_IN')
                AND new_stock = previous_stock + quantity_added
            )
            """,
            name="ck_stock_movement_stock_arithmetic"
        ),

        db.CheckConstraint(
            """
            movement_type IN (
                'STOCK_IN',
                'TRANSFER_IN',
                'TRANSFER_OUT'
            )
            """,
            name="ck_stock_movement_valid_type"
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
            "id": self.id,
            "cashier_id": self.cashier_id,
            "admin_username": self.admin_username,
            "movement_type": self.movement_type,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "branch_id": self.branch_id,
            "previous_stock": float(self.previous_stock),
            "quantity_added": float(self.quantity_added),
            "new_stock": float(self.new_stock),
            "reference": self.reference,
            "notes": self.notes,
            "created_at": (
                created_at_eat.isoformat()
                if created_at_eat
                else None
            ),
        }
