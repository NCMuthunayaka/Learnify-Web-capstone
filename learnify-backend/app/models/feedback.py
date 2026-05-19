from app.extensions import db
from datetime import datetime

class Feedback(db.Model):
    __tablename__ = "feedback"

    id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category        = db.Column(db.String(50), nullable=False)  # bug, feature, improvement, other
    title           = db.Column(db.String(255), nullable=False)
    content         = db.Column(db.Text, nullable=False)
    rating          = db.Column(db.Integer, nullable=False)  # 1-5 stars
    sentiment       = db.Column(db.String(20), nullable=True)  # positive, negative, neutral
    sentiment_score = db.Column(db.Float, nullable=True)  # 0-1
    is_resolved     = db.Column(db.Boolean, default=False)
    admin_response  = db.Column(db.Text, nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship("User", backref="feedbacks")

    def __repr__(self):
        return f"<Feedback {self.id} - {self.category}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": f"{self.user.first_name} {self.user.last_name}" if self.user else "Unknown",
            "category": self.category,
            "title": self.title,
            "content": self.content,
            "rating": self.rating,
            "sentiment": self.sentiment,
            "sentiment_score": self.sentiment_score,
            "is_resolved": self.is_resolved,
            "admin_response": self.admin_response,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
