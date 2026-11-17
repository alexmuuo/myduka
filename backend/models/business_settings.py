from copy import deepcopy

from sqlalchemy import ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from extensions import db


DEFAULT_BUSINESS_SETTINGS = {
    "store": {
        "currency": "KES",
        "timezone": "Africa/Nairobi",
        "dateFormat": "DD/MM/YYYY",
        "language": "en",
        "storeName": "",
        "storeSlug": "",
        "storeEmail": "",
        "storePhone": "",
        "storeDescription": "",
        "primaryColor": "#4f46e5",
        "secondaryColor": "#0f172a",
    },
    "orders": {
        "orderPrefix": "ORD",
        "taxEnabled": False,
        "taxRate": 16,
        "requireCustomerPhone": True,
        "allowGuestCheckout": True,
        "orderConfirmation": True,
    },
    "notifications": {
        "newOrderNotification": True,
        "lowStockNotification": True,
        "paymentNotification": True,
        "emailNotifications": True,
        "smsNotifications": False,
    },
}


class BusinessSettings(db.Model):

    __tablename__ = "business_settings"

    business_id = db.Column(
        UUID(as_uuid=True),
        ForeignKey(
            "businesses.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
        nullable=False,
    )

    settings = db.Column(
        JSONB,
        nullable=False,
        default=lambda: deepcopy(DEFAULT_BUSINESS_SETTINGS),
        server_default=db.text("'{}'::jsonb"),
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def to_dict(self):

        return {
            "business_id": str(self.business_id),
            "settings": deepcopy(
                self.settings or DEFAULT_BUSINESS_SETTINGS
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }

    def __repr__(self):

        return (
            f"<BusinessSettings business_id={self.business_id}>"
        )
