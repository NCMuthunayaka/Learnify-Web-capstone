from app.extensions import db


class Subject(db.Model):
    __tablename__ = "subjects"

    id        = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    name      = db.Column(db.String(100), unique=True, nullable=False)
    color_hex = db.Column(db.String(7),   default="#4A90D9")
    icon      = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f"<Subject {self.name}>"

    def to_dict(self):
        return {
            "id":        self.id,
            "name":      self.name,
            "color_hex": self.color_hex,
            "icon":      self.icon,
        }