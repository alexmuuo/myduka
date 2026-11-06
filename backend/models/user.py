from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


# Platform owner: manages all businesses. business_id is NULL.
ROLE_PLATFORM_ADMIN = "platform_admin"

# Business owner / manager: full access inside one business.
ROLE_OWNER = "owner"


class User(db.Model):
    """Back-office user (replaces the single env-var admin).

    Cashiers and customers keep their own tables and logins.
    """

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    username = db.Column(
        db.String(80),
        nullable=False
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    email = db.Column(
        db.String(150)
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(30),
        nullable=False,
        default=ROLE_OWNER
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

    business = db.relationship(
        "Business",
        back_populates="users"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "business_id",
            "username",
            name="uq_users_business_username"
        ),
        db.CheckConstraint(
            "role IN ('platform_admin', 'owner')",
            name="ck_users_role_valid"
        ),
        # Postgres treats NULLs as distinct, so platform admins
        # (business_id NULL) need their own unique index.
        db.Index(
            "uq_users_platform_username",
            "username",
            unique=True,
            postgresql_where=db.text("business_id IS NULL")
        ),
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
        }

    def __repr__(self):
        return f"<User {self.username}>"
