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
    """
    Verify Google token using Google's userinfo endpoint
    instead of id_token verification
    """
    import requests as http_requests
    from datetime import datetime

    try:
        # Use Google's userinfo endpoint to verify token
        # and get user info
        userinfo_response = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {google_token}"}
        )

        if userinfo_response.status_code != 200:
            return None, "Invalid Google token"

        # Get user info from Google
        id_info = userinfo_response.json()
        email   = id_info.get("email")
        name    = id_info.get("name")
        picture = id_info.get("picture")

        if not email:
            return None, "Could not get email from Google"

        # Check if user already exists
        user = User.query.filter_by(email=email).first()

        if user:
            # Existing user — update last login
            user.last_login = datetime.utcnow()
            if picture and not user.avatar_url:
                user.avatar_url = picture
            db.session.commit()
            return user, None
        else:
            # New user — create account
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
            return user, None

    except Exception as e:
        return None, f"Google authentication failed: {str(e)}"