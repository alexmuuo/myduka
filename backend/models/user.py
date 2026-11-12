from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class Profile(db.Model):
    """User profile linked directly to Supabase Auth."""

    __tablename__ = "profiles"

    id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True
    )

    full_name = db.Column(
        db.Text,
        nullable=True
    )

    phone = db.Column(
        db.Text,
        nullable=True
    )

    email = db.Column(
        db.Text,
        nullable=True
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
            "full_name": self.full_name,
            "phone": self.phone,
            "email": self.email,
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
        return f"<Profile {self.id}>"
