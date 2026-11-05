"""Tenant ownership for business-owned tables.

Every table that belongs to a single business uses TenantMixin. The
business_id column is NOT NULL and indexed, and it is filled in and
enforced centrally by tenancy.py, never taken from the request body.
"""

from sqlalchemy.orm import declared_attr

from extensions import db


class TenantMixin:
    """Adds a mandatory business_id foreign key to a model."""

    @declared_attr
    def business_id(cls):
        return db.Column(
            db.Integer,
            db.ForeignKey("businesses.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        )
