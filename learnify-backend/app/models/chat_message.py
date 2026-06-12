from datetime import datetime
from app.extensions import db


class ChatSession(db.Model):
    """Represents a single conversation thread between a user and the AI."""
    __tablename__ = "chat_sessions"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title      = db.Column(db.String(200), default="New Chat")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship(
        "ChatMessage",
        backref="session",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at.asc()",
    )

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "title":      self.title,
            "created_at": self.created_at.isoformat(),
        }


class ChatMessage(db.Model):
    """A single message inside a ChatSession (either from the user or the AI)."""
    __tablename__ = "chat_messages"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer,
        db.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    role      = db.Column(db.String(20), nullable=False)   # "user" | "assistant"
    content   = db.Column(db.Text, nullable=False)
    file_url  = db.Column(db.String(500), nullable=True)   # path/URL of uploaded file
    file_name = db.Column(db.String(255), nullable=True)   # original filename
    file_type = db.Column(db.String(50),  nullable=True)   # "pdf" | "image"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "session_id": self.session_id,
            "role":       self.role,
            "content":    self.content,
            "file_url":   self.file_url,
            "file_name":  self.file_name,
            "file_type":  self.file_type,
            "created_at": self.created_at.isoformat(),
        }
