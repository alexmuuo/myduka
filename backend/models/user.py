from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


ROLES = ("super_admin", "owner", "manager", "staff")


class User(db.Model):
    """A platform or business staff login.

    super_admin users belong to the platform (business_id is NULL).
    Every other role belongs to exactly one business. Cashiers and
    customers have their own tables and are not stored here.
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    email = db.Column(db.String(150), nullable=False, unique=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30))
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(db.String(20), nullable=False, default="staff")

    # Optional per-user permission list that overrides the role default.
    permissions = db.Column(db.JSON, nullable=True)

    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    business = db.relationship("Business")

    __table_args__ = (
        db.CheckConstraint(
            "role IN ('super_admin', 'owner', 'manager', 'staff')",
            name="ck_user_role",
        ),
        # Platform admins have no business; everyone else must have one.
        db.CheckConstraint(
            "(role = 'super_admin' AND business_id IS NULL) "
            "OR (role <> 'super_admin' AND business_id IS NOT NULL)",
            name="ck_user_role_matches_business",
        ),
        db.CheckConstraint(
            "email = lower(email)", name="ck_user_email_lowercase"
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
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "permissions": self.permissions,
            "is_active": self.is_active,
            "last_login_at": (
                self.last_login_at.isoformat()
                if self.last_login_at
                else None
            ),
        }
