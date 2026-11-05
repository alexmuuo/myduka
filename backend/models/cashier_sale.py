import uuid
from datetime import datetime
from decimal import Decimal

from extensions import db
from models.tenant import TenantMixin


ZERO = Decimal("0.00")
ZERO_QUANTITY = Decimal("0.000")


class CashierSale(TenantMixin, db.Model):
    __tablename__ = "cashier_sales"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sale_number = db.Column(
        db.String(50),
        nullable=False,
        unique=True,
        default=lambda: f"POS-{uuid.uuid4().hex[:12].upper()}"
    )

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    cashier_id = db.Column(
        db.Integer,
        db.ForeignKey("cashiers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    total = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    payment_method = db.Column(
        db.String(30),
        nullable=False
    )

    payment_status = db.Column(
        db.String(20),
        nullable=False,
        default="unpaid"
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="completed"
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    # Relationships
    branch = db.relationship(
        "Branch",
        back_populates="sales"
    )

    cashier = db.relationship(
        "Cashier"
    )

    items = db.relationship(
        "CashierSaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )

    payments = db.relationship(
        "CashierSalePayment",
        back_populates="sale",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        total = (
            Decimal(str(self.total))
            if self.total is not None
            else ZERO
        )

        return {
            "id": self.id,
            "sale_number": self.sale_number,

            "branch_id": self.branch_id,
            "branch_name": (
                self.branch.name
                if self.branch
                else None
            ),

            "cashier_id": self.cashier_id,
            "cashier_name": (
                self.cashier.full_name
                if self.cashier
                else None
            ),

            "total": float(total),

            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "status": self.status,

            "items": [
                item.to_dict()
                for item in self.items
            ],

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }


class CashierSaleItem(TenantMixin, db.Model):
    __tablename__ = "cashier_sale_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sale_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "cashier_sales.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "products.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    # Stock consumed, expressed in whole-stock-unit equivalents.
    #
    # Example:
    # A bottle sold in 2 portions, with 4 portions per bottle,
    # consumes 2 / 4 = 0.500 bottles.
    quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # Quantity actually sold to the customer.
    #
    # Example:
    # 2 portions means sale_quantity = 2.000,
    # while quantity = 0.500 bottles.
    sale_quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # Examples: "unit", "bottle", "portion".
    selling_unit = db.Column(
        db.String(50),
        nullable=False
    )

    # Price per selling unit, not necessarily per stock unit.
    #
    # Whole bottle: KSh 350 per bottle.
    # Portion: KSh 90 per portion.
    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    # Cost per whole stock unit, captured at the time of sale.
    buying_price = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    # Relationships
    sale = db.relationship(
        "CashierSale",
        back_populates="items"
    )

    product = db.relationship(
        "Product"
    )

    __table_args__ = (
        db.CheckConstraint(
            "quantity > 0",
            name="ck_cashier_sale_item_quantity_positive"
        ),

        db.CheckConstraint(
            "sale_quantity > 0",
            name="ck_cashier_sale_item_sale_quantity_positive"
        ),

        db.CheckConstraint(
            "price >= 0",
            name="ck_cashier_sale_item_price_nonnegative"
        ),

        db.CheckConstraint(
            "buying_price IS NULL OR buying_price >= 0",
            name="ck_cashier_sale_item_buying_price_nonnegative"
        ),
    )

    def to_dict(self):
        # Decimal conversion avoids floating-point arithmetic
        # errors in financial calculations.
        stock_quantity = (
            Decimal(str(self.quantity))
            if self.quantity is not None
            else ZERO_QUANTITY
        )

        sale_quantity = (
            Decimal(str(self.sale_quantity))
            if self.sale_quantity is not None
            else stock_quantity
        )

        price = (
            Decimal(str(self.price))
            if self.price is not None
            else ZERO
        )

        buying_price = (
            Decimal(str(self.buying_price))
            if self.buying_price is not None
            else None
        )

        # Revenue is based on the quantity sold, not the
        # stock-equivalent quantity consumed.
        subtotal = price * sale_quantity

        # Cost is based on the actual amount of stock consumed.
        cost_of_goods_sold = (
            buying_price * stock_quantity
            if buying_price is not None
            else None
        )

        # Gross profit = revenue - cost of stock consumed.
        gross_profit = (
            subtotal - cost_of_goods_sold
            if cost_of_goods_sold is not None
            else None
        )

        return {
            "id": self.id,
            "sale_id": self.sale_id,

            "product_id": self.product_id,
            "product_name": (
                self.product.name
                if self.product
                else None
            ),

            # Backward-compatible field: quantity remains
            # the stock-equivalent quantity consumed.
            "quantity": float(stock_quantity),

            "sale_quantity": float(sale_quantity),
            "selling_unit": self.selling_unit,

            "price": float(price),

            "buying_price": (
                float(buying_price)
                if buying_price is not None
                else None
            ),

            "subtotal": float(subtotal),

            "cost_of_goods_sold": (
                float(cost_of_goods_sold)
                if cost_of_goods_sold is not None
                else None
            ),

            "gross_profit": (
                float(gross_profit)
                if gross_profit is not None
                else None
            )
        }
