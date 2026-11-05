from datetime import datetime
from decimal import Decimal

from extensions import db
from models.tenant import TenantMixin


def _clean_quantity(value):
    """JSON-friendly quantity: whole numbers stay ints, fractions stay exact."""
    if value is None:
        return 0
    value = Decimal(str(value))
    if value == value.to_integral_value():
        return int(value)
    return float(value)


# ============================================================
# ORDER MODEL
# ============================================================

class Order(TenantMixin, db.Model):
    __tablename__ = "orders"

    # --------------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # --------------------------------------------------------
    # ORDER IDENTIFICATION
    # --------------------------------------------------------

    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # --------------------------------------------------------
    # CUSTOMER INFORMATION
    # --------------------------------------------------------

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False
    )

    # --------------------------------------------------------
    # ORDER INFORMATION
    # --------------------------------------------------------

    order_type = db.Column(
        db.String(30),
        nullable=False
    )

    delivery_location = db.Column(
        db.Text,
        nullable=True
    )

    notes = db.Column(
        db.Text,
        nullable=True
    )

    total = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    # --------------------------------------------------------
    # PAYMENT INFORMATION
    # --------------------------------------------------------

    payment_method = db.Column(
        db.String(30),
        nullable=False
    )

    payment_status = db.Column(
        db.String(20),
        nullable=False,
        default="unpaid"
    )

    # Payment status must only change after payment has been
    # verified or manually confirmed by an authorized admin.
    #
    # Changing the order or delivery status must never
    # automatically mark an order as paid.

    # --------------------------------------------------------
    # ORDER STATUS
    # --------------------------------------------------------

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    # --------------------------------------------------------
    # DELIVERY MANAGEMENT
    # --------------------------------------------------------

    delivery_person = db.Column(
        db.String(100),
        nullable=True
    )

    delivery_phone = db.Column(
        db.String(30),
        nullable=True
    )

    delivery_status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    delivery_notes = db.Column(
        db.Text,
        nullable=True
    )

    # --------------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------------

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    customer = db.relationship(
        "Customer",
        back_populates="orders"
    )

    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    # --------------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------------

    def to_dict(self):
        """Convert the order and its related data into a dictionary."""

        return {
            "id": self.id,
            "order_number": self.order_number,

            "customer": (
                self.customer.to_dict()
                if self.customer
                else None
            ),

            "customer_id": self.customer_id,

            "order_type": self.order_type,
            "delivery_location": self.delivery_location,
            "notes": self.notes,

            "payment_method": self.payment_method,
            "payment_status": self.payment_status,

            "total": (
                float(self.total)
                if self.total is not None
                else 0.0
            ),

            "status": self.status,

            "delivery_person": self.delivery_person,
            "delivery_phone": self.delivery_phone,
            "delivery_status": self.delivery_status,
            "delivery_notes": self.delivery_notes,

            "items": [
                item.to_dict()
                for item in self.items
            ],

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }


# ============================================================
# ORDER ITEM MODEL
# ============================================================

class OrderItem(TenantMixin, db.Model):
    __tablename__ = "order_items"

    # --------------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # --------------------------------------------------------
    # ORDER RELATIONSHIP
    # --------------------------------------------------------

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    # --------------------------------------------------------
    # PRODUCT RELATIONSHIP
    # --------------------------------------------------------

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    # --------------------------------------------------------
    # QUANTITY AND PRICES
    # --------------------------------------------------------

    quantity = db.Column(
        db.Numeric(12, 3),
        nullable=False
    )

    # Selling price per unit at the time of the sale.
    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    # Buying price per unit at the time of the sale.
    #
    # Nullable for compatibility with historical order items
    # whose original buying price was not recorded.
    #
    # This value is a snapshot: changing the current product's
    # buying price must not change the profit on an old sale.
    buying_price = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    order = db.relationship(
        "Order",
        back_populates="items"
    )

    product = db.relationship(
        "Product"
    )

    # --------------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------------

    def to_dict(self):
        """Convert the order item into a dictionary."""

        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,

            "product_name": (
                self.product.name
                if self.product
                else None
            ),

            "quantity": _clean_quantity(self.quantity),

            # Selling price per unit.
            "price": (
                float(self.price)
                if self.price is not None
                else 0.0
            ),

            # Buying price per unit when it was recorded.
            # None means the historical cost is unknown.
            "buying_price": (
                float(self.buying_price)
                if self.buying_price is not None
                else None
            ),

            # Total selling value of this line item.
            "subtotal": (
                float(self.price * self.quantity)
                if self.price is not None
                else 0.0
            ),

            # Total cost of this line item, if known.
            "cost_subtotal": (
                float(self.buying_price * self.quantity)
                if self.buying_price is not None
                else None
            ),

            # Profit for this line item, if its cost is known.
            "gross_profit": (
                float(
                    (self.price - self.buying_price)
                    * self.quantity
                )
                if (
                    self.price is not None
                    and self.buying_price is not None
                )
                else None
            ),
        }

