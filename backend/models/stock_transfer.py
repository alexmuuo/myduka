from datetime import datetime, timezone

from extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class StockTransfer(db.Model):
    __tablename__ = "stock_transfers"

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

    reference = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    source_branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id"),
        nullable=False,
        index=True
    )

    destination_branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id"),
        nullable=False,
        index=True
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="COMPLETED",
        server_default="COMPLETED"
    )

    admin_username = db.Column(
        db.String(100),
        nullable=False
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

    # --------------------------------------------------------
    # BRANCH RELATIONSHIPS
    # --------------------------------------------------------

    source_branch = db.relationship(
        "Branch",
        foreign_keys=[source_branch_id]
    )

    destination_branch = db.relationship(
        "Branch",
        foreign_keys=[destination_branch_id]
    )

    # --------------------------------------------------------
    # TRANSFER ITEMS
    # --------------------------------------------------------

    items = db.relationship(
        "StockTransferItem",
        back_populates="transfer",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # --------------------------------------------------------
    # DATABASE CONSTRAINTS
    # --------------------------------------------------------

    __table_args__ = (
        db.UniqueConstraint(
            "business_id", "reference",
            name="uq_stock_transfers_business_reference"
        ),

        db.CheckConstraint(
            "source_branch_id != destination_branch_id",
            name="ck_stock_transfer_different_branches"
        ),

        db.CheckConstraint(
            "status = 'COMPLETED'",
            name="ck_stock_transfer_completed"
        ),
    )

    # --------------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------------

    def to_dict(self):
        return {
            "id": self.id,
            "reference": self.reference,

            "source_branch_id": self.source_branch_id,
            "source_branch_name": (
                self.source_branch.name
                if self.source_branch else None
            ),

            "destination_branch_id": self.destination_branch_id,
            "destination_branch_name": (
                self.destination_branch.name
                if self.destination_branch else None
            ),

            "status": self.status,
            "admin_username": self.admin_username,
            "notes": self.notes,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),

            "items": [
                item.to_dict()
                for item in self.items
            ]
        }


class StockTransferItem(db.Model):
    __tablename__ = "stock_transfer_items"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    transfer_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "stock_transfers.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # --------------------------------------------------------
    # SOURCE PRODUCT
    # --------------------------------------------------------

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    # --------------------------------------------------------
    # DESTINATION PRODUCT
    # --------------------------------------------------------

    destination_product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=True,
        index=True
    )

    # Original/source product name.
    product_name = db.Column(
        db.String(255),
        nullable=False
    )

    # --------------------------------------------------------
    # TRANSFER QUANTITY
    # --------------------------------------------------------

    quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # --------------------------------------------------------
    # SOURCE BRANCH STOCK
    # --------------------------------------------------------

    source_previous_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    source_new_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # --------------------------------------------------------
    # DESTINATION BRANCH STOCK
    # --------------------------------------------------------

    destination_previous_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    destination_new_stock = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    transfer = db.relationship(
        "StockTransfer",
        back_populates="items"
    )

    product = db.relationship(
        "Product",
        foreign_keys=[product_id]
    )

    destination_product = db.relationship(
        "Product",
        foreign_keys=[destination_product_id]
    )

    # --------------------------------------------------------
    # DATABASE CONSTRAINTS
    # --------------------------------------------------------

    __table_args__ = (
        db.UniqueConstraint(
            "transfer_id",
            "product_id",
            name="uq_stock_transfer_product"
        ),

        db.CheckConstraint(
            "quantity > 0",
            name="ck_stock_transfer_item_quantity_positive"
        ),

        db.CheckConstraint(
            "source_new_stock >= 0",
            name="ck_stock_transfer_source_nonnegative"
        ),

        db.CheckConstraint(
            "destination_new_stock >= 0",
            name="ck_stock_transfer_destination_nonnegative"
        ),
    )

    # --------------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------------

    def to_dict(self):

        source_name = (
            self.product.name
            if self.product else self.product_name
        )

        destination_name = (
            self.destination_product.name
            if self.destination_product else None
        )

        return {
            "id": self.id,

            # Source product
            "product_id": self.product_id,
            "product_name": self.product_name,
            "source_product_name": source_name,

            # Destination product
            "destination_product_id": self.destination_product_id,
            "destination_product_name": destination_name,

            # Quantity
            "quantity": float(self.quantity),

            # Source stock
            "source_previous_stock": float(
                self.source_previous_stock
            ),

            "source_new_stock": float(
                self.source_new_stock
            ),

            # Destination stock
            "destination_previous_stock": float(
                self.destination_previous_stock
            ),

            "destination_new_stock": float(
                self.destination_new_stock
            )
        }
