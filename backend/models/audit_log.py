from datetime import datetime

from extensions import db


class AuditLog(db.Model):
    """Append-only record of security and business-critical actions.

    business_id is NULL for platform-level events (super admin actions,
    failed logins before a business is known). Read access to this table
    is never scoped automatically, so routes must filter it explicitly.
    """

    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id", ondelete="SET NULL"),
        nullable=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Who acted when there is no users row, for example a cashier or an
    # email address on a failed login.
    actor = db.Column(db.String(150))

    action = db.Column(db.String(80), nullable=False)
    entity_type = db.Column(db.String(60))
    entity_id = db.Column(db.String(60))
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(64))

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        db.Index("ix_audit_business_created", "business_id", "created_at"),
        db.Index("ix_audit_action_created", "action", "created_at"),
        db.Index("ix_audit_actor_created", "actor", "created_at"),
    )
