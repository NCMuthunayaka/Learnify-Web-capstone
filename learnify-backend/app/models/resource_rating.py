from app.extensions import db
from datetime import datetime


class ResourceRating(db.Model):
    __tablename__ = "resource_ratings"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    resource_id = db.Column(db.Integer, db.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating      = db.Column(db.SmallInteger, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("resource_id", "user_id", name="uq_resource_user"),
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "resource_id": self.resource_id,
            "user_id":     self.user_id,
            "rating":      self.rating,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }
