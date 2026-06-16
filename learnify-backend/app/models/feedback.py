from app.extensions import db
from datetime import datetime


class Feedback(db.Model):
    __tablename__ = "feedback"

    id         = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    user_id    = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    subject    = db.Column(db.String(100), nullable=False)
    mentor_id  = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=True)
    rating     = db.Column(db.SmallInteger, nullable=False)
    category   = db.Column(
        db.Enum("Mentor Quality", "Session Quality", "Platform Issue", "AI Assistant", "General"),
        nullable=False, default="General"
    )
    comment    = db.Column(db.Text,        nullable=False)
    sentiment  = db.Column(db.Enum("positive", "neutral", "negative"), nullable=True)
    confidence = db.Column(db.Numeric(4, 3), nullable=True)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self, user_name=None):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "user_name":  user_name,
            "subject":    self.subject,
            "mentor_id":  self.mentor_id,
            "rating":     self.rating,
            "category":   self.category,
            "comment":    self.comment,
            "sentiment":  self.sentiment,
            "confidence": float(self.confidence) if self.confidence else None,
            "created_at": self.created_at.isoformat(),
        }
