from flask import Flask, app, send_from_directory, request
from app.extensions import db, jwt, migrate, bcrypt, cors, mail
from app.routes import auth, chat, scheduler, tracking, feedback, resources, admin, notifications, users, subjects, dashboard, progress, help_requests, mentor
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
from dotenv import load_dotenv
from app.models.chat_message      import ChatSession, ChatMessage
from app.models.feedback          import Feedback
from flask_mail import Mail

load_dotenv()

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    app.config["MAIL_SERVER"]         = "smtp.gmail.com"
    app.config["MAIL_PORT"]           = 587
    app.config["MAIL_USE_TLS"]        = True
    app.config["MAIL_USERNAME"]       = os.environ.get("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"]       = os.environ.get("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER")

    if not app.config["MAIL_USERNAME"]:
        print("⚠️  WARNING: MAIL_USERNAME not set — forgot password emails will fail")

    mail.init_app(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    mail.init_app(app)  
    
    frontend_url_env = os.getenv("FRONTEND_URL", "*")
    if frontend_url_env == "*":
        allowed_origins = "*"
    else:
        allowed_origins = [url.strip().rstrip("/") for url in frontend_url_env.split(",") if url.strip()]
        
    cors.init_app(app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=allowed_origins != "*",
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # ── Fix Google OAuth popup issue ──────────────────────
    @app.after_request
    def add_headers(response):
        response.headers["Cross-Origin-Opener-Policy"]   = "unsafe-none"
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        
        origin = request.headers.get("Origin")
        frontend_url_env = os.getenv("FRONTEND_URL", "*")
        
        if frontend_url_env == "*":
            response.headers["Access-Control-Allow-Origin"] = "*"
        else:
            allowed_origins = [url.strip().rstrip("/") for url in frontend_url_env.split(",") if url.strip()]
            request_origin = origin.rstrip("/") if origin else None
            
            if request_origin and request_origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                default_origin = allowed_origins[0] if allowed_origins else "*"
                response.headers["Access-Control-Allow-Origin"] = default_origin
                if default_origin != "*":
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    
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
    app.register_blueprint(progress.bp,      url_prefix="/api/progress")
    app.register_blueprint(help_requests.bp, url_prefix="/api/help_requests")
    app.register_blueprint(mentor.bp,        url_prefix="/api/mentor")

    register_error_handlers(app)
    return app