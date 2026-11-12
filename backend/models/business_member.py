from sqlalchemy.dialects.postgresql import UUID

from extensions import db


ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_CASHIER = "cashier"

VALID_ROLES = {
    ROLE_OWNER,
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_CASHIER,
}


class BusinessMember(db.Model):
    """Connects a Supabase user to a MyDuka business."""

    __tablename__ = "business_members"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=db.text("gen_random_uuid()")
    )

    business_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Supabase auth.users FK is enforced by PostgreSQL.
    # We intentionally omit its SQLAlchemy ForeignKey declaration.
    user_id = db.Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    role = db.Column(
        db.Text,
        nullable=False,
        default=ROLE_CASHIER,
        server_default=ROLE_CASHIER
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.func.now()
    )

    __table_args__ = (
        db.UniqueConstraint(
            "business_id",
            "user_id",
            name="business_members_business_id_user_id_key"
        ),
        db.CheckConstraint(
            "role IN ('owner', 'admin', 'manager', 'cashier')",
            name="business_members_role_check"
        ),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "user_id": str(self.user_id),
            "role": self.role,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }

    def __repr__(self):
        return (
            f"<BusinessMember user={self.user_id} "
            f"business={self.business_id} role={self.role}>"
        )
