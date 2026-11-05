from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class CashierSaleAudit(TenantMixin, db.Model):
    __tablename__ = "cashier_sale_audit"

    # Primary key
    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    # Related POS sale
    sale_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "cashier_sales.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # Administrator who performed the action
    admin_username = db.Column(
        db.String(100),
        nullable=False,
    )

    # Action performed: edited or voided
    action = db.Column(
        db.String(30),
        nullable=False,
    )

    # Mandatory explanation for the action
    reason = db.Column(
        db.Text,
        nullable=False,
    )

    # Snapshots before and after the change
    before_data = db.Column(
        db.JSON,
        nullable=False,
    )

    after_data = db.Column(
        db.JSON,
        nullable=False,
    )

    # Timestamp
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    # Relationship to the POS sale
    sale = db.relationship(
        "CashierSale",
        foreign_keys=[sale_id],
    )

    def to_dict(self):
        return {
            "id": self.id,
            "sale_id": self.sale_id,
            "admin_username": self.admin_username,
            "action": self.action,
            "reason": self.reason,
            "before_data": self.before_data,
            "after_data": self.after_data,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }

