from datetime import datetime

from extensions import db


class Business(db.Model):
    """A tenant: one business with its own shop, branches, staff and customers.

    The slug is the public shop identifier used in URLs (/s/<slug>).
    """

    __tablename__ = "businesses"

    id = db.Column(
        db.Integer,
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

    email = db.Column(
        db.String(150)
    )

    phone = db.Column(
        db.String(30)
    )

    logo = db.Column(
        db.String(500)
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    users = db.relationship(
        "User",
        back_populates="business"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "logo": self.logo,
            "is_active": self.is_active,
        }

    def __repr__(self):
        return f"<Business {self.slug}>"
