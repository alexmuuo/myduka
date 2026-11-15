from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class BranchStaff(db.Model):
    __tablename__ = "branch_staff"

    business_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False
    )

    branch_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False
    )

    user_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        nullable=True,
        server_default=db.true()
    )

    assigned_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        server_default=db.func.now()
    )

    __table_args__ = (
        db.ForeignKeyConstraint(
            ["branch_id", "business_id"],
            ["branches.id", "branches.business_id"],
            name="branch_staff_branch_id_business_id_fkey",
            ondelete="CASCADE"
        ),

        db.ForeignKeyConstraint(
            ["business_id", "user_id"],
            [
                "business_members.business_id",
                "business_members.user_id"
            ],
            name="branch_staff_business_id_user_id_fkey",
            ondelete="CASCADE"
        ),
    )

    def to_dict(self):
        return {
            "business_id": str(self.business_id),
            "branch_id": str(self.branch_id),
            "user_id": str(self.user_id),
            "is_active": self.is_active,
            "assigned_at": (
                self.assigned_at.isoformat()
                if self.assigned_at else None
            )
        }

    def __repr__(self):
        return (
            f"<BranchStaff business={self.business_id} "
            f"branch={self.branch_id} user={self.user_id}>"
        )
