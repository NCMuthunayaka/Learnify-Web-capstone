from app.extensions import db
from datetime import datetime


class Resource(db.Model):
    __tablename__ = "resources"

    id             = db.Column(db.Integer,      primary_key=True, autoincrement=True)
    uploader_id    = db.Column(db.Integer,      db.ForeignKey("users.id"),       nullable=False)
    subject_id     = db.Column(db.Integer,      db.ForeignKey("subjects.id"),    nullable=False)
    file_type_id   = db.Column(db.Integer,      db.ForeignKey("file_types.id"),  nullable=False)
    title          = db.Column(db.String(255),  nullable=False)
    file_url       = db.Column(db.String(500),  nullable=False)
    file_size_mb   = db.Column(db.Numeric(8,2), default=0.00)
    duration_sec   = db.Column(db.Integer,      nullable=True)
    status         = db.Column(db.Enum("draft", "pending_review", "published", "hidden"), default="draft")
    view_count     = db.Column(db.Integer,      default=0)
    download_count = db.Column(db.Integer,      default=0)
    uploaded_at    = db.Column(db.DateTime,     default=datetime.utcnow)
    published_at   = db.Column(db.DateTime,     nullable=True)

    def __repr__(self):
        return f"<Resource {self.title}>"

    def to_dict(self):
        return {
            "id":             self.id,
            "uploader_id":    self.uploader_id,
            "subject_id":     self.subject_id,
            "file_type_id":   self.file_type_id,
            "title":          self.title,
            "file_url":       self.file_url,
            "file_size_mb":   float(self.file_size_mb),
            "duration_sec":   self.duration_sec,
            "status":         self.status,
            "view_count":     self.view_count,
            "download_count": self.download_count,
            "uploaded_at":    self.uploaded_at.isoformat(),
            "published_at":   self.published_at.isoformat() if self.published_at else None,
        }