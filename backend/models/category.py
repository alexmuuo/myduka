from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID

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

    is_active = db.Column(
        db.Boolean,
        nullable=True,
        default=True,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    __table_args__ = (
        db.UniqueConstraint(
            "business_id",
            "name",
            name="categories_business_id_name_key"
        ),
        db.UniqueConstraint(
            "id",
            "business_id",
            name="categories_id_business_id_key"
        ),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "name": self.name,
            "description": self.description,
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
