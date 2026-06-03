from app.extensions import db


class FileType(db.Model):
    __tablename__ = "file_types"

    id   = db.Column(db.Integer,    primary_key=True, autoincrement=True)
    name = db.Column(db.String(10), unique=True, nullable=False)

    def __repr__(self):
        return f"<FileType {self.name}>"