from datetime import datetime

from extensions import db
from models.tenant import TenantMixin


class Category(TenantMixin, db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "business_id", "name", name="uq_category_business_name"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "sort_order": self.sort_order,
            "is_active": self.is_active,
        }
