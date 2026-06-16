from flask import Flask, send_from_directory
from app.extensions import db, jwt, migrate, bcrypt, cors
from app.routes import auth, chat, scheduler, tracking, feedback, resources, admin, notifications, users, subjects, dashboard
from app.config import config
from app.middleware.error_handler import register_error_handlers
from app.models.user              import User
from app.models.resource          import Resource
from app.models.notification      import Notification
from app.models.notification_type import NotificationType
from app.models.subject           import Subject
from app.models.file_type         import FileType
from app.models.token_blocklist   import TokenBlocklist
import os


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    cors.init_app(app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # ── Fix Google OAuth popup issue ──────────────────────
    @app.after_request
    def add_headers(response):
        response.headers["Cross-Origin-Opener-Policy"]  = "unsafe-none"
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

    # ── Serve uploaded files ──────────────────────────────
    # This makes /uploads/filename.pdf accessible from browser
    @app.route("/uploads/<path:filename>")
    def serve_file(filename):
        upload_folder = app.config["UPLOAD_FOLDER"]
        return send_from_directory(upload_folder, filename)

    # Register blueprints
    app.register_blueprint(auth.bp,          url_prefix="/api/auth")
    app.register_blueprint(chat.bp,          url_prefix="/api/chat")
    app.register_blueprint(scheduler.bp,     url_prefix="/api/scheduler")
    app.register_blueprint(tracking.bp,      url_prefix="/api/tracking")
    app.register_blueprint(feedback.bp,      url_prefix="/api/feedback")
    app.register_blueprint(resources.bp,     url_prefix="/api/resources")
    app.register_blueprint(admin.bp,         url_prefix="/api/admin")
    app.register_blueprint(notifications.bp, url_prefix="/api/notifications")
    app.register_blueprint(users.bp,         url_prefix="/api/users")
    app.register_blueprint(subjects.bp,      url_prefix="/api/subjects")
    app.register_blueprint(dashboard.bp,     url_prefix="/api/dashboard")

    register_error_handlers(app)
    return app