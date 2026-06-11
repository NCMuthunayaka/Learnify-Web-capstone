from flask import Flask
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


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Fix Google OAuth popup issue
    @app.after_request
    def add_headers(response):
        response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        return response

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

    # ── Custom Secure CLI Commands ──
    import click
    @app.cli.command("create-admin")
    @click.option("--email", prompt="Admin Email", help="The email address of the administrator.")
    @click.password_option(prompt="Admin Password", help="The password of the administrator.")
    def create_admin_cmd(email, password):
        """Create a new administrator account securely."""
        from app.models.user import User
        from app.extensions import db, bcrypt

        if not email or "@" not in email:
            click.echo("Error: Invalid email address format.")
            return

        existing = User.query.filter_by(email=email).first()
        if existing:
            click.echo(f"Error: Email {email} is already registered.")
            return

        if len(password) < 8:
            click.echo("Error: Password must be at least 8 characters long.")
            return

        try:
            password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
            admin = User(
                name="System Administrator",
                email=email,
                password_hash=password_hash,
                role="admin",
                status="active"
            )
            db.session.add(admin)
            db.session.commit()
            click.echo(f"[OK] Administrator account {email} created successfully!")
        except Exception as e:
            db.session.rollback()
            click.echo(f"[ERROR] Failed to create administrator: {e}")

    return app