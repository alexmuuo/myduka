"""Default subscription plans and plan-limit checks.

Limits are enforced on the server when a business adds a branch,
cashier or product (see check_plan_limit). Prices are placeholders
until a real payment provider (M-Pesa) is connected; nothing here
takes payment.
"""

from datetime import datetime, timedelta

from extensions import db
from models.business import SubscriptionPlan


TRIAL_DAYS = 14

DEFAULT_PLANS = [
    {
        "code": "trial", "name": "Free Trial", "price_monthly": 0,
        "max_branches": 1, "max_cashiers": 2, "max_products": 100,
        "features": {"advanced_reports": False},
    },
    {
        "code": "basic", "name": "Basic", "price_monthly": 1500,
        "max_branches": 1, "max_cashiers": 3, "max_products": 500,
        "features": {"advanced_reports": False},
    },
    {
        "code": "standard", "name": "Standard", "price_monthly": 3500,
        "max_branches": 3, "max_cashiers": 10, "max_products": 5000,
        "features": {"advanced_reports": True},
    },
    {
        "code": "premium", "name": "Premium", "price_monthly": 7500,
        "max_branches": None, "max_cashiers": None, "max_products": None,
        "features": {"advanced_reports": True},
    },
]


def ensure_default_plans():
    """Create any missing default plan. Safe to run repeatedly."""
    for spec in DEFAULT_PLANS:
        if SubscriptionPlan.query.filter_by(code=spec["code"]).first():
            continue

        db.session.add(SubscriptionPlan(**spec))

    db.session.flush()


def trial_end():
    return datetime.utcnow() + timedelta(days=TRIAL_DAYS)


def check_plan_limit(business, model, limit_field):
    """Return an error message if adding one more row would exceed the plan.

    `model` must be a tenant model; the count is automatically limited to
    the current business. Returns None when the add is allowed.
    """
    plan = business.plan

    if plan is None:
        return None

    limit = getattr(plan, limit_field)

    if limit is None:
        return None

    if model.query.count() >= limit:
        return (
            f"Your {plan.name} plan allows up to {limit}. "
            "Upgrade your plan to add more."
        )

    return None
