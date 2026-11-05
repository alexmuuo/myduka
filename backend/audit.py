"""Audit logging and DB-backed login throttling (works on serverless)."""

from datetime import datetime, timedelta

from flask import g, has_request_context, request

from extensions import db
from models.audit_log import AuditLog


def client_ip():
    if not has_request_context():
        return None

    forwarded = request.headers.get("X-Forwarded-For", "")

    return (
        forwarded.split(",")[0].strip()
        or request.remote_addr
        or None
    )


def record_audit(
    action,
    *,
    entity_type=None,
    entity_id=None,
    details=None,
    business_id=None,
    user_id=None,
    actor=None,
    commit=False,
):
    """Add an audit row. Pass commit=True when nothing else commits."""
    if business_id is None and has_request_context():
        business_id = getattr(g, "business_id", None)

    entry = AuditLog(
        business_id=business_id,
        user_id=user_id,
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=None if entity_id is None else str(entity_id),
        details=details,
        ip_address=client_ip(),
    )

    db.session.add(entry)

    if commit:
        db.session.commit()

    return entry


def recent_count(action, *, actor=None, ip=None, minutes=15):
    """Count recent audit rows for an actor or an IP address."""
    since = datetime.utcnow() - timedelta(minutes=minutes)

    query = AuditLog.query.filter(
        AuditLog.action == action,
        AuditLog.created_at >= since,
    )

    if actor is not None and ip is not None:
        query = query.filter(
            db.or_(AuditLog.actor == actor, AuditLog.ip_address == ip)
        )
    elif actor is not None:
        query = query.filter(AuditLog.actor == actor)
    elif ip is not None:
        query = query.filter(AuditLog.ip_address == ip)

    return query.count()
