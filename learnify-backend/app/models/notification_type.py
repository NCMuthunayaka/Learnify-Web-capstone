from app.extensions import db


class NotificationType(db.Model):
    __tablename__ = "notification_types"

    id   = db.Column(db.Integer,    primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"<NotificationType {self.name}>"