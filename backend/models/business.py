from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class Business(db.Model):
    """A business tenant in the MyDuka platform."""

    __tablename__ = "businesses"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    slug = db.Column(
        db.String(60),
        nullable=False,
        unique=True,
        index=True
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    address = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "phone": self.phone,
            "address": self.address,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }

    def __repr__(self):
        return f"<Business {self.slug}>"
