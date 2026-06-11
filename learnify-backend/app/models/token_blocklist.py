from app.extensions import db
from datetime import datetime


class TokenBlocklist(db.Model):
    """
    Stores revoked JWT IDs (jti) so that logged-out tokens
    cannot be reused even before they expire.
    """
    __tablename__ = "token_blocklist"

    id         = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    jti        = db.Column(db.String(36),  nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(10),  nullable=False, default="access")
    revoked_at = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    user_id    = db.Column(db.Integer,     nullable=True)   # informational only

    def __repr__(self):
        return f"<TokenBlocklist jti={self.jti} type={self.token_type}>"
