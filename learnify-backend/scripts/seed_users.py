import os
import sys

# Add the parent directory to the Python path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User

app = create_app("development")

with app.app_context():
    # ── 1. Create Admin User ──
    admin = User.query.filter_by(email="admin@learnify.com").first()
    if not admin:
        admin = User(
            name="Platform Admin",
            email="admin@learnify.com",
            password_hash=bcrypt.generate_password_hash("password").decode("utf-8"),
            role="admin",
            status="active"
        )
        db.session.add(admin)
        print("[OK] Seeded Admin Account: admin@learnify.com / password")
    else:
        print("Admin account already exists.")

    # ── 2. Create Mentor User ──
    mentor = User.query.filter_by(email="mentor@learnify.com").first()
    if not mentor:
        mentor = User(
            name="Dr. James Davis",
            email="mentor@learnify.com",
            password_hash=bcrypt.generate_password_hash("password").decode("utf-8"),
            role="mentor",
            status="active"
        )
        db.session.add(mentor)
        print("[OK] Seeded Mentor Account: mentor@learnify.com / password")
    else:
        print("Mentor account already exists.")

    # ── 3. Create Student User ──
    student = User.query.filter_by(email="student@learnify.com").first()
    if not student:
        student = User(
            name="Nirmal Kumara",
            email="student@learnify.com",
            password_hash=bcrypt.generate_password_hash("password").decode("utf-8"),
            role="student",
            status="active"
        )
        db.session.add(student)
        print("[OK] Seeded Student Account: student@learnify.com / password")
    else:
        print("Student account already exists.")

    try:
        db.session.commit()
        print("\n[SUCCESS] Seeding successfully completed!")
    except Exception as e:
        db.session.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
