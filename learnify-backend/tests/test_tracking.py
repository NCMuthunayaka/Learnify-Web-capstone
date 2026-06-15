import unittest
import json
from datetime import date, datetime, timedelta
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.analytics_service import ensure_student_profile


class TrackingTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        # Clean up existing test records
        db.session.execute(text("DELETE FROM users WHERE email LIKE 'test_%'"))
        db.session.commit()

        # Create a test student user
        db.session.execute(
            text(
                "INSERT INTO users (name, email, password_hash, role, status) "
                "VALUES ('Test Student', 'test_student@learnify.com', 'dummy_hash', 'student', 'active')"
            )
        )
        db.session.commit()

        # Get test student's user ID
        row = db.session.execute(
            text("SELECT id FROM users WHERE email = 'test_student@learnify.com'")
        ).fetchone()
        self.user_id = row[0]

        # Generate JWT headers
        self.access_token = create_access_token(identity=str(self.user_id))
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        # Ensure student profile is created
        ensure_student_profile(self.user_id)

        # Get student profile ID
        profile_row = db.session.execute(
            text("SELECT id FROM student_profiles WHERE user_id = :uid"),
            {"uid": self.user_id}
        ).fetchone()
        self.profile_id = profile_row[0]

        # Ensure there is at least one subject in DB
        subject_row = db.session.execute(text("SELECT id FROM subjects LIMIT 1")).fetchone()
        if subject_row:
            self.subject_id = subject_row[0]
        else:
            db.session.execute(
                text("INSERT INTO subjects (name, color_hex) VALUES ('Test Subject', '#FFFFFF')")
            )
            db.session.commit()
            subject_row = db.session.execute(text("SELECT id FROM subjects LIMIT 1")).fetchone()
            self.subject_id = subject_row[0]

        # Enroll test student in subject
        db.session.execute(
            text(
                "INSERT IGNORE INTO student_subjects (student_id, subject_id) "
                "VALUES (:spid, :subid)"
            ),
            {"spid": self.profile_id, "subid": self.subject_id}
        )
        db.session.commit()

        # Create a dummy study session for testing
        self.session_date = date.today()
        self.start_time = datetime.now()
        self.end_time = self.start_time + timedelta(hours=2)
        
        db.session.execute(
            text(
                "INSERT INTO study_sessions (student_id, subject_id, start_time, end_time, duration_min, session_type, completed) "
                "VALUES (:uid, :subid, :start, :end, 120, 'study', 0)"
            ),
            {
                "uid": self.user_id,
                "subid": self.subject_id,
                "start": self.start_time,
                "end": self.end_time
            }
        )
        db.session.commit()

        session_row = db.session.execute(
            text("SELECT id FROM study_sessions WHERE student_id = :uid ORDER BY id DESC LIMIT 1"),
            {"uid": self.user_id}
        ).fetchone()
        self.session_id = session_row[0]

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM progress_snapshots WHERE student_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM study_sessions WHERE student_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM student_subjects WHERE student_id = :spid"), {"spid": self.profile_id})
        db.session.execute(text("DELETE FROM student_profiles WHERE user_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_start_session_endpoint(self):
        # Start study session
        response = self.client.post(
            f"/api/tracking/sessions/{self.session_id}/start",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])

    def test_end_session_completed_endpoint(self):
        # End study session as Completed with 2 hours
        response = self.client.post(
            f"/api/tracking/sessions/{self.session_id}/end",
            headers=self.headers,
            data=json.dumps({"status": "Completed", "hours": 2.0})
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertTrue(data["data"]["completed"])
        self.assertEqual(data["data"]["duration_min"], 120)

        # Check DB updates for study session
        sess = db.session.execute(
            text("SELECT completed, duration_min FROM study_sessions WHERE id = :sid"),
            {"sid": self.session_id}
        ).fetchone()
        self.assertEqual(sess[0], 1)
        self.assertEqual(sess[1], 120)

        # Check DB updates for daily progress snapshot
        snap = db.session.execute(
            text("SELECT study_hours FROM progress_snapshots WHERE student_id = :uid AND subject_id = :subid AND snapshot_date = :sdate"),
            {"uid": self.user_id, "subid": self.subject_id, "sdate": self.session_date}
        ).fetchone()
        self.assertIsNotNone(snap)
        self.assertEqual(float(snap[0]), 2.0)

    def test_end_session_partial_endpoint(self):
        # End study session as Partially Completed with 1.5 hours (90 minutes)
        response = self.client.post(
            f"/api/tracking/sessions/{self.session_id}/end",
            headers=self.headers,
            data=json.dumps({"status": "Partially Completed", "hours": 1.5})
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertTrue(data["data"]["completed"])
        self.assertEqual(data["data"]["duration_min"], 90)

        # Check DB updates
        sess = db.session.execute(
            text("SELECT completed, duration_min FROM study_sessions WHERE id = :sid"),
            {"sid": self.session_id}
        ).fetchone()
        self.assertEqual(sess[0], 1)
        self.assertEqual(sess[1], 90)

        snap = db.session.execute(
            text("SELECT study_hours FROM progress_snapshots WHERE student_id = :uid AND subject_id = :subid AND snapshot_date = :sdate"),
            {"uid": self.user_id, "subid": self.subject_id, "sdate": self.session_date}
        ).fetchone()
        self.assertIsNotNone(snap)
        self.assertEqual(float(snap[0]), 1.5)

    def test_end_session_awards_streak_achievement(self):
        # Update study streak to 14 in student_profile to trigger achievement
        db.session.execute(
            text("UPDATE student_profiles SET study_streak_days = 14 WHERE user_id = :uid"),
            {"uid": self.user_id}
        )
        db.session.commit()

        # End study session
        response = self.client.post(
            f"/api/tracking/sessions/{self.session_id}/end",
            headers=self.headers,
            data=json.dumps({"status": "Completed", "hours": 2.0})
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertIn("Study Streak 14", data["data"]["achievements_earned"])

        # Verify DB user_achievements table
        ach = db.session.execute(
            text("SELECT COUNT(*) FROM user_achievements WHERE user_id = :uid"),
            {"uid": self.user_id}
        ).scalar()
        self.assertEqual(ach, 1)


if __name__ == "__main__":
    unittest.main()
