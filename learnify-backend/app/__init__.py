from flask import Flask
from app.extensions import db, jwt, migrate, bcrypt, cors
from app.routes import auth, chat, scheduler, tracking, feedback, resources, admin, notifications, users, subjects
from app.config import config
from app.middleware.error_handler import register_error_handlers
from app.models.user              import User
from app.models.resource          import Resource
from app.models.notification      import Notification
from app.models.notification_type import NotificationType
from app.models.subject           import Subject
from app.models.file_type         import FileType


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
    })

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

    register_error_handlers(app)
    return app