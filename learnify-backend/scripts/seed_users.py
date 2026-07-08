import os
import sys
from datetime import datetime

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
        db.session.commit()
        print("[OK] Seeded Student Account: student@learnify.com / password")
    else:
        print("Student account already exists.")

    # Ensure profile exists for seeded student
    from sqlalchemy import text
    student_id_val = student.id if student else 3
    profile = db.session.execute(
        text("SELECT id FROM student_profiles WHERE user_id = :uid"),
        {"uid": student_id_val}
    ).fetchone()
    if not profile:
        db.session.execute(
            text(
                "INSERT INTO student_profiles (user_id, available_hours_per_week, study_streak_days, total_points, semester_goal_pct) "
                "VALUES (:uid, 10, 0, 0, 0.0)"
            ),
            {"uid": student_id_val}
        )
        db.session.commit()
        print("[OK] Seeded Student Profile for student@learnify.com")

    # Ensure profile exists for seeded mentor
    mentor_id_val = mentor.id if mentor else 2
    mentor_prof = db.session.execute(
        text("SELECT id FROM mentor_profiles WHERE user_id = :uid"),
        {"uid": mentor_id_val}
    ).fetchone()
    if not mentor_prof:
        db.session.execute(
            text(
                "INSERT INTO mentor_profiles (user_id, title, institution, years_experience, rating, total_students_helped, avg_response_time_min, accept_urgent, email_notifications, auto_accept_returning, bio) "
                "VALUES (:uid, 'Academic Mentor', 'Learnify', 5, 4.8, 142, 18, 1, 1, 0, 'PhD in Applied Mathematics from MIT. Specialty in Calculus and Algebra.')"
            ),
            {"uid": mentor_id_val}
        )
        db.session.commit()
        print("[OK] Seeded Mentor Profile for mentor@learnify.com")
        mentor_prof = db.session.execute(
            text("SELECT id FROM mentor_profiles WHERE user_id = :uid"),
            {"uid": mentor_id_val}
        ).fetchone()

    mentor_prof_id = mentor_prof[0]

    # Seed mentor availability
    avail_count = db.session.execute(
        text("SELECT COUNT(*) FROM mentor_availability WHERE mentor_id = :mpid"),
        {"mpid": mentor_prof_id}
    ).scalar() or 0
    if avail_count == 0:
        for d_id in range(1, 6): # Mon-Fri
            db.session.execute(
                text(
                    "INSERT INTO mentor_availability (mentor_id, day_id, from_time, until_time, max_daily_requests) "
                    "VALUES (:mpid, :day_id, '10:00:00', '18:00:00', 8)"
                ),
                {"mpid": mentor_prof_id, "day_id": d_id}
            )
        db.session.commit()
        print("[OK] Seeded default Mon-Fri Availability slots for mentor")

    # Seed initial help requests if count is 0
    hr_count = db.session.execute(
        text("SELECT COUNT(*) FROM help_requests")
    ).scalar() or 0
    if hr_count == 0:
        # Request 1 (Mathematics)
        db.session.execute(
            text(
                "INSERT INTO help_requests (id, student_id, subject_id, assigned_to, request_type, topic_title, description, priority, status, created_at) "
                "VALUES (101, :sid, 1, :mid, 'mentor', 'Need help with Integration by Parts', 'I am having trouble applying integration by parts to trigonometric functions. Specifically, when we have repeating integrals like e^x * sin(x). Any simple shortcut or method to remember the sequence?', 'high', 'pending', :now)"
            ),
            {"sid": student_id_val, "mid": mentor_id_val, "now": datetime.utcnow()}
        )
        # Request 2 (Physics)
        db.session.execute(
            text(
                "INSERT INTO help_requests (id, student_id, subject_id, assigned_to, request_type, topic_title, description, priority, status, created_at) "
                "VALUES (102, :sid, 2, :mid, 'mentor', 'Proof by Contradiction in Triangles', 'I am confused on how to start the proof showing that a triangle cannot have more than one obtuse angle using proof by contradiction. What is the negation statement I should begin with?', 'medium', 'in_progress', :now)"
            ),
            {"sid": student_id_val, "mid": mentor_id_val, "now": datetime.utcnow()}
        )
        # Reply to Request 2
        db.session.execute(
            text(
                "INSERT INTO help_responses (request_id, responder_id, content, created_at) "
                "VALUES (102, :mid, 'Hi student, for proof by contradiction, start by assuming the opposite of what you want to prove. Assume the triangle does have two obtuse angles (both > 90 degrees). Then calculate the sum of angles. It will exceed 180 degrees, which contradicts the triangle sum theorem!', :now)"
            ),
            {"mid": mentor_id_val, "now": datetime.utcnow()}
        )
        # Request 3 (Chemistry)
        db.session.execute(
            text(
                "INSERT INTO help_requests (id, student_id, subject_id, assigned_to, request_type, topic_title, description, priority, status, created_at) "
                "VALUES (103, :sid, 3, :mid, 'mentor', 'Regression Analysis & R-Squared Value', 'Could you explain what a low R-squared value with a significant p-value means in a linear regression? Does it mean the model is still useful?', 'low', 'resolved', :now)"
            ),
            {"sid": student_id_val, "mid": mentor_id_val, "now": datetime.utcnow()}
        )
        # Replies to Request 3
        db.session.execute(
            text(
                "INSERT INTO help_responses (request_id, responder_id, content, created_at) "
                "VALUES (103, :mid, 'A low R-squared but low p-value means that your independent variables are still statistically significant (there is a real relationship), but they do not explain much of the variability in the dependent variable. It is common in social sciences where behavior is hard to predict.', :now)"
            ),
            {"mid": mentor_id_val, "now": datetime.utcnow()}
        )
        db.session.execute(
            text(
                "INSERT INTO help_responses (request_id, responder_id, content, created_at) "
                "VALUES (103, :sid, 'That makes perfect sense. Thank you so much, Dr. Davis! I will mark this as resolved.', :now)"
            ),
            {"sid": student_id_val, "now": datetime.utcnow()}
        )
        db.session.commit()
        print("[OK] Seeded 3 mock Help Requests and Responses")

    try:
        db.session.commit()
        print("\n[SUCCESS] Seeding successfully completed!")
    except Exception as e:
        db.session.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
