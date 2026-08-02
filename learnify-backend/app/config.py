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

def _fix_db_url(url: str) -> str:
    """
    Fix database URL schemes that Railway/Heroku provide in legacy formats.
    - mysql://      -> mysql+pymysql://   (Railway MySQL plugin)
    - postgres://   -> postgresql://      (Railway/Heroku PostgreSQL)
    """
    if not url:
        return url
    if url.startswith("mysql://"):
        url = url.replace("mysql://", "mysql+pymysql://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class BaseConfig:
    SECRET_KEY                     = os.getenv("JWT_SECRET_KEY", "change-me")
    JWT_SECRET_KEY                 = os.getenv("JWT_SECRET_KEY", "change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES       = 900
    JWT_REFRESH_TOKEN_EXPIRES      = 604800

    # ── Upload settings ───────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
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

class ProductionConfig(BaseConfig):
    DEBUG                   = False
    SQLALCHEMY_DATABASE_URI = _fix_db_url(os.getenv("DATABASE_URL"))

config = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
}