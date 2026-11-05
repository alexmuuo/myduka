"""Role defaults and per-user permission overrides for business staff."""

PERMISSIONS = frozenset({
    "dashboard.view",
    "products.manage",
    "categories.manage",
    "inventory.manage",
    "branches.manage",
    "cashiers.manage",
    "customers.view",
    "orders.manage",
    "payments.view",
    "transfers.manage",
    "reports.view",
    "exports.run",
    "sales.void",
    "settings.manage",
    "staff.manage",
})

ROLE_DEFAULTS = {
    "owner": PERMISSIONS,
    "manager": PERMISSIONS - {"staff.manage", "settings.manage"},
    "staff": frozenset({
        "dashboard.view",
        "customers.view",
        "orders.manage",
    }),
}


def effective_permissions(user):
    """A user's own permission list wins over the role default."""
    if user.role == "super_admin":
        return frozenset()

    if isinstance(user.permissions, list):
        return frozenset(user.permissions) & PERMISSIONS

    return ROLE_DEFAULTS.get(user.role, frozenset())


def has_permission(user, permission):
    return permission in effective_permissions(user)
