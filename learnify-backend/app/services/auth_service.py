from app.extensions import db, bcrypt
from app.models.user import User
from datetime import datetime


def ensure_mentor_applications_table():
    from sqlalchemy import text
    try:
        db.session.execute(text("SELECT 1 FROM mentor_applications LIMIT 1"))
    except Exception:
        db.session.rollback()
        try:
            db.session.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS mentor_applications ("
                    "id INT NOT NULL AUTO_INCREMENT,"
                    "user_id INT NOT NULL,"
                    "qualifications TEXT NOT NULL,"
                    "certifications TEXT NOT NULL,"
                    "status VARCHAR(20) NOT NULL DEFAULT 'pending',"
                    "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                    "PRIMARY KEY (id),"
                    "UNIQUE KEY uq_ma_user (user_id),"
                    "CONSTRAINT fk_ma_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
                    ") ENGINE = InnoDB;"
                )
            )
            db.session.commit()
        except Exception:
            db.session.rollback()
            try:
                db.session.execute(
                    text(
                        "CREATE TABLE IF NOT EXISTS mentor_applications ("
                        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                        "user_id INTEGER NOT NULL UNIQUE,"
                        "qualifications TEXT NOT NULL,"
                        "certifications TEXT NOT NULL,"
                        "status VARCHAR(20) NOT NULL DEFAULT 'pending',"
                        "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
                        ")"
                    )
                )
                db.session.commit()
            except Exception as ex:
                db.session.rollback()
                print(f"Failed to create mentor_applications table: {ex}")


def register_user(name, email, password, role="student", qualifications=None, certifications=None):
    existing = User.query.filter_by(email=email).first()
    if existing:
        return None, "Email already registered"

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    # If role is mentor, they register as a student role first while application is pending
    actual_role = "student" if role == "mentor" else role

    user = User(
        name          = name,
        email         = email,
        password_hash = password_hash,
        role          = actual_role,
        status        = "active",
    )
    db.session.add(user)
    db.session.commit()

    from sqlalchemy import text

    # Seed student profiles for student and mentor-applicant accounts
    if actual_role == "student":
        try:
            db.session.execute(
                text(
                    "INSERT INTO student_profiles (user_id, available_hours_per_week, study_streak_days, total_points, semester_goal_pct) "
                    "VALUES (:uid, 0, 0, 0, 0.0)"
                ),
                {"uid": user.id}
            )
            db.session.commit()
        except Exception:
            db.session.rollback()

    # If they requested mentor, record the application details
    if role == "mentor":
        ensure_mentor_applications_table()
        try:
            db.session.execute(
                text(
                    "INSERT INTO mentor_applications (user_id, qualifications, certifications, status) "
                    "VALUES (:uid, :qual, :cert, 'pending')"
                ),
                {
                    "uid": user.id,
                    "qual": qualifications or "Not provided",
                    "cert": certifications or "Not provided"
                }
            )
            db.session.commit()
        except Exception:
            db.session.rollback()

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
            headers={"Authorization": f"Bearer {google_token}"},
            timeout=10
        )

        if userinfo_response.status_code != 200:
            return None, False, f"Invalid Google token (status {userinfo_response.status_code})"

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

            try:
                from sqlalchemy import text
                db.session.execute(
                    text(
                        "INSERT INTO student_profiles (user_id, available_hours_per_week, study_streak_days, total_points, semester_goal_pct) "
                        "VALUES (:uid, 0, 0, 0, 0.0)"
                    ),
                    {"uid": user.id}
                )
                db.session.commit()
            except Exception:
                db.session.rollback()

            return user, True, None  # True = new user

    except Exception as e:
        return None, False, f"Google authentication failed: {str(e)}"