"""
Creates an admin user in the database.
Run: python seed_admin.py
"""
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User

app = create_app("development")

ADMIN_NAME     = "Admin"
ADMIN_EMAIL    = "admin@learnify.com"
ADMIN_PASSWORD = "Admin@123"

with app.app_context():
    existing = User.query.filter_by(email=ADMIN_EMAIL).first()
    if existing:
        print(f"Admin already exists: {ADMIN_EMAIL}")
    else:
        hashed = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")
        admin = User(
            name          = ADMIN_NAME,
            email         = ADMIN_EMAIL,
            password_hash = hashed,
            role          = "admin",
            status        = "active",
        )
        db.session.add(admin)
        db.session.commit()
        print(f"Admin created successfully!")
        print(f"  Email   : {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
