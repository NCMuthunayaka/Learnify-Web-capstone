from app.extensions import db
from datetime import datetime


class Notification(db.Model):
    __tablename__ = "notifications"

    id         = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    user_id    = db.Column(db.Integer,     db.ForeignKey("users.id"),              nullable=False)
    type_id    = db.Column(db.Integer,     db.ForeignKey("notification_types.id"), nullable=False)
    title      = db.Column(db.String(255), nullable=False)
    body       = db.Column(db.Text,        nullable=False)
    is_read    = db.Column(db.Boolean,     default=False)
    action_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    # Relationship to get type name easily
    notification_type = db.relationship(
        "NotificationType",
        backref="notifications",
        lazy=True
    )

    def __repr__(self):
        return f"<Notification {self.title}>"

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "type_id":    self.type_id,
            # Get type name from relationship
            "type":       self.notification_type.name
                          if self.notification_type else "system",
            "title":      self.title,
            "body":       self.body,
            "is_read":    self.is_read,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat(),
        }