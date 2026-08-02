from app.extensions import db
from datetime import datetime


class PasswordReset(db.Model):
    __tablename__ = "password_resets"

    id         = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    user_id    = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    token      = db.Column(db.String(255), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime,    nullable=False)
    used       = db.Column(db.Boolean,     default=False,  nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def is_valid(self):
        return not self.used and datetime.utcnow() < self.expires_at