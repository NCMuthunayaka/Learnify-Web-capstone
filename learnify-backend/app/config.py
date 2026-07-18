import os
from dotenv import load_dotenv

load_dotenv()

# Allowed file types
ALLOWED_EXTENSIONS = {
    "pdf":  "PDF",
    "docx": "DOCX",
    "pptx": "PPTX",
    "mp4":  "Video",
}

class BaseConfig:
    SECRET_KEY                     = os.getenv("JWT_SECRET_KEY", "change-me")
    JWT_SECRET_KEY                 = os.getenv("JWT_SECRET_KEY", "change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES       = 900
    JWT_REFRESH_TOKEN_EXPIRES      = 604800

    # ── Upload settings ───────────────────────────────────
    UPLOAD_FOLDER   = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle":  1800,
        "pool_pre_ping": True,
        "pool_timeout":  30,
        "pool_size":     10,
        "max_overflow":  20,
    }

class DevelopmentConfig(BaseConfig):
    DEBUG                   = True
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

def _get_database_url() -> str:
    """
    Reads DATABASE_URL from the environment and normalises the scheme.
    Railway (and Heroku) historically provide 'postgres://' but SQLAlchemy
    1.4+ requires 'postgresql://'.  Raises a clear error if not set at all.
    """
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Add it in your Railway service → Variables tab."
        )
    # Fix legacy 'postgres://' scheme used by Railway / Heroku
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class ProductionConfig(BaseConfig):
    DEBUG                   = False
    SQLALCHEMY_DATABASE_URI = _get_database_url()

    @classmethod
    def _validate(cls):
        if os.getenv("JWT_SECRET_KEY", "change-me") == "change-me":
            raise ValueError("JWT_SECRET_KEY environment variable must be set in production")

config = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
}