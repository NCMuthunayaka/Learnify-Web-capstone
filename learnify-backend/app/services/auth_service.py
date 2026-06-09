from app.extensions import db, bcrypt
from app.models.user import User
from datetime import datetime


def register_user(name, email, password, role="student"):
    existing = User.query.filter_by(email=email).first()
    if existing:
        return None, "Email already registered"

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

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
    user = User.query.filter_by(email=email).first()
    if not user:
        return None, "Invalid email or password"

    if not bcrypt.check_password_hash(user.password_hash, password):
        return None, "Invalid email or password"

    if user.status != "active":
        return None, "Account is not active"

    user.last_login = datetime.utcnow()
    db.session.commit()
    return user, None


def google_auth_user(google_token):
    import requests as http_requests
    from datetime import datetime

    try:
        userinfo_response = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {google_token}"}
        )

        if userinfo_response.status_code != 200:
            return None, False, "Invalid Google token"

        id_info = userinfo_response.json()
        email   = id_info.get("email")
        name    = id_info.get("name")
        picture = id_info.get("picture")

        if not email:
            return None, False, "Could not get email from Google"

        user = User.query.filter_by(email=email).first()

        if user:
            # Existing user
            user.last_login = datetime.utcnow()
            if picture and not user.avatar_url:
                user.avatar_url = picture
            db.session.commit()
            return user, False, None  # False = not new user

        else:
            # New user
            import secrets
            random_password = secrets.token_hex(32)
            password_hash   = bcrypt.generate_password_hash(
                random_password
            ).decode("utf-8")

            user = User(
                name          = name or email.split("@")[0],
                email         = email,
                password_hash = password_hash,
                avatar_url    = picture,
                role          = "student",
                status        = "active",
            )
            db.session.add(user)
            db.session.commit()
            return user, True, None  # True = new user

    except Exception as e:
        return None, False, f"Google authentication failed: {str(e)}"