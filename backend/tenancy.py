"""Central tenant isolation for MyDuka.

How it works
------------
* Every request that reaches business data has g.business_id set by an
  auth decorator from the *database row* of the authenticated user,
  cashier or customer (or from the shop slug on public storefront
  routes). It is never read from a request body, query string or token
  claim.
* Every ORM SELECT inside a request is automatically restricted to
  g.business_id for all TenantMixin models (loader criteria below), so
  a forgotten filter in a route cannot leak another business's rows.
  Without a tenant the filter matches nothing (fail closed).
* New rows get business_id filled in automatically on flush, and
  writing a row for a different business, or changing a row's
  business_id, raises TenantViolation.
* Code that legitimately needs to read across tenants (login lookups,
  the M-Pesa callback, super admin) must say so with `unscoped()`.

Outside a request (scripts, tests that use only an app context) no
filtering is applied, so seed scripts can work across businesses.
"""

from contextlib import contextmanager
from functools import wraps

from flask import g, has_request_context, jsonify, request
from sqlalchemy import event, inspect
from sqlalchemy.orm import Session, with_loader_criteria

from models.business import Business
from models.tenant import TenantMixin


# Matches no row, because ids start at 1.
NO_TENANT_ID = -1

SHOP_HEADER = "X-Shop-Slug"


class TenantError(Exception):
    """Base class for tenant isolation failures."""


class TenantViolation(TenantError):
    """A write tried to cross a tenant boundary."""


class TenantContextMissing(TenantError):
    """A tenant-owned row was written with no tenant in scope."""


# ------------------------------------------------------------
# CONTEXT
# ------------------------------------------------------------

def current_business_id():
    if not has_request_context():
        return None

    return getattr(g, "business_id", None)


def set_tenant(business_id):
    g.business_id = business_id


@contextmanager
def unscoped():
    """Temporarily disable automatic tenant filtering."""
    previous = getattr(g, "tenant_unscoped", False)
    g.tenant_unscoped = True

    try:
        yield

    finally:
        g.tenant_unscoped = previous


def _filtering_state():
    """Return (active, business_id) for the current execution."""
    if not has_request_context():
        return False, None

    if getattr(g, "tenant_unscoped", False):
        return False, None

    return True, getattr(g, "business_id", None)


# ------------------------------------------------------------
# AUTOMATIC SCOPING OF READS
# ------------------------------------------------------------

@event.listens_for(Session, "do_orm_execute")
def _scope_tenant_reads(execute_state):
    if not execute_state.is_select:
        return

    # Column and relationship loads follow a row that was already loaded
    # through a scoped query.
    if (
        execute_state.is_column_load
        or execute_state.is_relationship_load
    ):
        return

    active, business_id = _filtering_state()

    if not active:
        return

    scoped_id = NO_TENANT_ID if business_id is None else business_id

    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(
            TenantMixin,
            lambda cls: cls.business_id == scoped_id,
            include_aliases=True,
        )
    )


# ------------------------------------------------------------
# AUTOMATIC STAMPING AND PROTECTION OF WRITES
# ------------------------------------------------------------

@event.listens_for(Session, "before_flush")
def _guard_tenant_writes(session, flush_context, instances):
    if not has_request_context():
        return

    business_id = getattr(g, "business_id", None)
    is_unscoped = getattr(g, "tenant_unscoped", False)

    for obj in list(session.new):
        if not isinstance(obj, TenantMixin):
            continue

        if obj.business_id is None:
            if business_id is None:
                raise TenantContextMissing(
                    f"No business in scope for new {type(obj).__name__}."
                )

            obj.business_id = business_id

        elif not is_unscoped and obj.business_id != business_id:
            raise TenantViolation(
                f"Refused to write {type(obj).__name__} for "
                f"business {obj.business_id} from business "
                f"{business_id}."
            )

    for obj in list(session.dirty):
        if not isinstance(obj, TenantMixin):
            continue

        history = inspect(obj).attrs.business_id.history

        if history.deleted:
            raise TenantViolation(
                f"business_id of {type(obj).__name__} cannot change."
            )

        if not is_unscoped and obj.business_id != business_id:
            raise TenantViolation(
                f"Refused to modify {type(obj).__name__} of another "
                "business."
            )


# ------------------------------------------------------------
# SHOP (STOREFRONT) CONTEXT FOR PUBLIC ROUTES
# ------------------------------------------------------------

def business_is_open(business):
    """Whether a business may serve its shop and staff right now."""
    return business is not None and business.status == "active"


def resolve_shop_from_request():
    slug = (request.headers.get(SHOP_HEADER) or "").strip().lower()

    if not slug:
        return None

    return Business.query.filter_by(slug=slug).first()


def shop_context_required(view_function):
    """Public storefront routes: the shop comes from X-Shop-Slug."""

    @wraps(view_function)
    def wrapped(*args, **kwargs):
        business = resolve_shop_from_request()

        if not business_is_open(business):
            return jsonify({
                "status": "error",
                "message": "Shop not found.",
            }), 404

        g.business = business
        set_tenant(business.id)

        return view_function(*args, **kwargs)

    return wrapped
