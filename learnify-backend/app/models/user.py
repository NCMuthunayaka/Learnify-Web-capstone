from app.extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    name          = db.Column(db.String(150),  nullable=False)
    email         = db.Column(db.String(255),  unique=True, nullable=False)
    password_hash = db.Column(db.String(255),  nullable=False)
    role          = db.Column(db.Enum("student", "mentor", "admin"), default="student")
    status        = db.Column(db.Enum("active", "pending", "inactive"), default="pending")
    avatar_url    = db.Column(db.String(500),  nullable=True)

    # ── Student & Education fields ────────────────────────
    phone           = db.Column(db.String(20),   nullable=True)
    bio             = db.Column(db.Text,         nullable=True)
    education_level = db.Column(db.String(50),   nullable=True, default="university")
    school_name     = db.Column(db.String(200),  nullable=True)
    grade_level     = db.Column(db.String(50),   nullable=True)
    stream_focus    = db.Column(db.String(100),  nullable=True)
    student_id      = db.Column(db.String(50),   nullable=True)
    university      = db.Column(db.String(200),  nullable=True)
    faculty         = db.Column(db.String(200),  nullable=True)
    year            = db.Column(db.String(20),   nullable=True)

    # ── Mentor fields ─────────────────────────────────────
    department      = db.Column(db.String(200),  nullable=True)
    subject         = db.Column(db.String(100),  nullable=True)
    experience      = db.Column(db.String(50),   nullable=True)

    created_at      = db.Column(db.DateTime,     default=datetime.utcnow)
    last_login      = db.Column(db.DateTime,     nullable=True)

    # Relationships
    resources       = db.relationship("Resource",     backref="uploader", lazy=True)
    notifications   = db.relationship("Notification", backref="user",     lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        return {
            "id":              self.id,
            "name":            self.name,
            "email":           self.email,
            "role":            self.role,
            "status":          self.status,
            "avatar_url":      self.avatar_url,
            "phone":           self.phone,
            "bio":             self.bio,
            "education_level": getattr(self, "education_level", "university") or "university",
            "school_name":     getattr(self, "school_name", None),
            "grade_level":     getattr(self, "grade_level", None),
            "stream_focus":    getattr(self, "stream_focus", None),
            "student_id":      self.student_id,
            "university":      self.university,
            "faculty":         self.faculty,
            "year":            self.year,
            "department":      self.department,
            "subject":         self.subject,
            "experience":      self.experience,
            "created_at":      (self.created_at.isoformat() + "Z") if self.created_at and not self.created_at.isoformat().endswith("Z") else (self.created_at.isoformat() if self.created_at else None),
            "last_login":      self.last_login.isoformat() if self.last_login else None,
        }