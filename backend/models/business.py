from datetime import datetime

from extensions import db


BUSINESS_STATUSES = ("pending", "active", "suspended")
SUBSCRIPTION_STATUSES = ("trialing", "active", "past_due", "cancelled")

BUSINESS_TYPES = (
    "liquor_store",
    "supermarket",
    "grocery",
    "pharmacy",
    "electronics",
    "clothing",
    "hardware",
    "agrovet",
    "general_retail",
)


class SubscriptionPlan(db.Model):
    """A plan a business can subscribe to (trial, basic, standard, premium).

    A NULL limit means unlimited. Limits are enforced by plan_limits.py.
    """

    __tablename__ = "subscription_plans"

    id = db.Column(db.Integer, primary_key=True)

    code = db.Column(db.String(30), nullable=False, unique=True)
    name = db.Column(db.String(80), nullable=False)

    price_monthly = db.Column(
        db.Numeric(10, 2), nullable=False, default=0
    )

    max_branches = db.Column(db.Integer, nullable=True)
    max_cashiers = db.Column(db.Integer, nullable=True)
    max_products = db.Column(db.Integer, nullable=True)

    # Feature flags, for example {"advanced_reports": true}.
    features = db.Column(db.JSON, nullable=False, default=dict)

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        db.CheckConstraint(
            "price_monthly >= 0", name="ck_plan_price_nonnegative"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "price_monthly": float(self.price_monthly or 0),
            "max_branches": self.max_branches,
            "max_cashiers": self.max_cashiers,
            "max_products": self.max_products,
            "features": self.features or {},
        }


class Business(db.Model):
    """A tenant: one independent business with its own shop."""

    __tablename__ = "businesses"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(150), nullable=False)

    # URL-safe, lowercase, globally unique shop address (/shop/<slug>).
    slug = db.Column(db.String(60), nullable=False, unique=True)

    business_type = db.Column(
        db.String(40), nullable=False, default="general_retail"
    )

    description = db.Column(db.Text)
    logo_url = db.Column(db.String(500))
    phone = db.Column(db.String(30))
    email = db.Column(db.String(150))
    location = db.Column(db.String(255))

    status = db.Column(
        db.String(20), nullable=False, default="active", index=True
    )

    plan_id = db.Column(
        db.Integer,
        db.ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    subscription_status = db.Column(
        db.String(20), nullable=False, default="trialing"
    )

    trial_ends_at = db.Column(db.DateTime, nullable=True)

    # Per-business options, for example portion sales or delivery.
    settings = db.Column(db.JSON, nullable=False, default=dict)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    plan = db.relationship("SubscriptionPlan")

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('pending', 'active', 'suspended')",
            name="ck_business_status",
        ),
        db.CheckConstraint(
            "subscription_status IN "
            "('trialing', 'active', 'past_due', 'cancelled')",
            name="ck_business_subscription_status",
        ),
        db.CheckConstraint(
            "slug = lower(slug)", name="ck_business_slug_lowercase"
        ),
    )

    def to_public_dict(self):
        """Fields safe to show on a public storefront."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "business_type": self.business_type,
            "description": self.description,
            "logo_url": self.logo_url,
            "phone": self.phone,
            "email": self.email,
            "location": self.location,
        }

    def to_dict(self):
        data = self.to_public_dict()
        data.update({
            "status": self.status,
            "subscription_status": self.subscription_status,
            "trial_ends_at": (
                self.trial_ends_at.isoformat()
                if self.trial_ends_at
                else None
            ),
            "plan": self.plan.to_dict() if self.plan else None,
            "settings": self.settings or {},
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
        })
        return data
