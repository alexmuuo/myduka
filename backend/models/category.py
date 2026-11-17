from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Index, func

from extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey(
            "businesses.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    name = db.Column(
        db.Text,
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    color = db.Column(
        db.String(7),
        nullable=False,
        default="#64748b",
        server_default="#64748b"
    )

    icon = db.Column(
        db.Text,
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        Index(
            "uq_categories_business_name_lower",
            business_id,
            func.lower(name),
            unique=True
        ),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            )
        }

    def __repr__(self):
        return f"<Category {self.name}>"
