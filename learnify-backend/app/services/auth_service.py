from app.extensions import db, bcrypt
from app.models.user import User
from datetime import datetime


def register_user(name, email, password, role="student"):
    # Check if email already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return None, "Email already registered"

    # Hash password
    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    # Create user
    user = User(
        name          = name,
        email         = email,
        password_hash = password_hash,
        role          = role,
        status        = "active",
    )
    db.session.add(user)
    db.session.commit()

    return user, None


def login_user(email, password):
    # Find user
    user = User.query.filter_by(email=email).first()
    if not user:
        return None, "Invalid email or password"

    # Check password
    if not bcrypt.check_password_hash(user.password_hash, password):
        return None, "Invalid email or password"

    # Check status
    if user.status != "active":
        return None, "Account is not active"

    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()

    return user, None