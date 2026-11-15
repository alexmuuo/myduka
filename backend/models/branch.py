from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class Branch(db.Model):
    __tablename__ = "branches"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey(
            "businesses.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    name = db.Column(
        db.Text,
        nullable=False
    )

    phone = db.Column(db.Text)
    address = db.Column(db.Text)

    is_main = db.Column(
        db.Boolean,
        nullable=False,
        server_default=db.false()
    )

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
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    business = db.relationship(
        "Business",
        backref=db.backref("branches", lazy=True)
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "name": self.name,
            "phone": self.phone,
            "address": self.address,
            "is_main": self.is_main,
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
        return f"<Branch {self.name}>"
