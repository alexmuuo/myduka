from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class Business(db.Model):
    """A business tenant on MyDuka."""

    __tablename__ = "businesses"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    name = db.Column(
        db.Text,
        nullable=False
    )

    slug = db.Column(
        db.Text,
        nullable=False,
        unique=True,
        index=True
    )

    phone = db.Column(db.Text)
    email = db.Column(db.Text)
    address = db.Column(db.Text)
    logo_url = db.Column(db.Text)

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now()
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "logo_url": self.logo_url,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }

    def __repr__(self):
        return f"<Business {self.slug}>"
