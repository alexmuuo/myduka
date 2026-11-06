from datetime import datetime

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from extensions import db


class Cashier(db.Model):
    __tablename__ = "cashiers"

    # --------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # --------------------------------------------------
    # ACCOUNT INFORMATION
    # --------------------------------------------------

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    username = db.Column(
        db.String(80),
        nullable=False,
        index=True
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    # --------------------------------------------------
    # BRANCH ASSIGNMENT
    # --------------------------------------------------

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "branches.id",
            ondelete="RESTRICT"
        ),
        nullable=True,
        index=True
    )

    branch = db.relationship(
        "Branch",
        back_populates="cashiers"
    )

    # --------------------------------------------------
    # ACCOUNT STATUS
    # --------------------------------------------------

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    # --------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "business_id", "username",
            name="uq_cashiers_business_username"
        ),
    )

    # --------------------------------------------------
    # PASSWORD MANAGEMENT
    # --------------------------------------------------

    def set_password(self, password):
        """Hash and save the cashier's password."""
        self.password_hash = generate_password_hash(
            password
        )

    def check_password(self, password):
        """Verify a supplied password."""
        return check_password_hash(
            self.password_hash,
            password
        )

    # --------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------

    def to_dict(self):
        """Return safe cashier information."""
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "branch_id": self.branch_id,
            "branch_name": (
                self.branch.name
                if self.branch
                else None
            ),
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }

    # --------------------------------------------------
    # REPRESENTATION
    # --------------------------------------------------

    def __repr__(self):
        return f"<Cashier {self.username}>"

