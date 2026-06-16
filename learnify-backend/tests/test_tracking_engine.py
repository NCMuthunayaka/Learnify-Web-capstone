import unittest
import json
from datetime import datetime, timedelta, date
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.analytics_service import ensure_student_profile
from app.services.tracking_engine import compute_session_status, get_productivity_metrics


class TrackingEngineTestCase(unittest.TestCase):
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
        
        # Get subject ID to assign sessions to
        sub_row = db.session.execute(text("SELECT id FROM subjects LIMIT 1")).fetchone()
        self.subject_id = sub_row[0] if sub_row else 1

        # Clear existing sessions for testing reliability
        db.session.execute(text("DELETE FROM study_sessions WHERE student_id = :uid"), {"uid": self.user_id})
        db.session.commit()

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM study_sessions WHERE student_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM student_profiles WHERE user_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_session_status_computation(self):
        # 1. Create a future session (Pending)
        future_start = datetime.now() + timedelta(days=2)
        future_end = future_start + timedelta(hours=2)
        db.session.execute(
            text(
                "INSERT INTO study_sessions (student_id, subject_id, start_time, end_time, duration_min, completed) "
                "VALUES (:uid, :subid, :start, :end, 0, 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id, "start": future_start, "end": future_end}
        )
        
        # 2. Create a past session that wasn't completed (Missed)
        past_start = datetime.now() - timedelta(days=2)
        past_end = past_start + timedelta(hours=1)
        db.session.execute(
            text(
                "INSERT INTO study_sessions (student_id, subject_id, start_time, end_time, duration_min, completed) "
                "VALUES (:uid, :subid, :start, :end, 0, 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id, "start": past_start, "end": past_end}
        )

        # 3. Create a completed session
        comp_start = datetime.now() - timedelta(days=1)
        comp_end = comp_start + timedelta(hours=2)
        db.session.execute(
            text(
                "INSERT INTO study_sessions (student_id, subject_id, start_time, end_time, duration_min, completed) "
                "VALUES (:uid, :subid, :start, :end, 120, 1)"
            ),
            {"uid": self.user_id, "subid": self.subject_id, "start": comp_start, "end": comp_end}
        )
        db.session.commit()

        # Retrieve IDs
        s_rows = db.session.execute(
            text("SELECT id, completed, start_time FROM study_sessions WHERE student_id = :uid"),
            {"uid": self.user_id}
        ).fetchall()

        for sid, completed, start in s_rows:
            status = compute_session_status(sid)
            if completed == 1:
                self.assertEqual(status, "COMPLETED")
            elif start > datetime.now():
                self.assertEqual(status, "PENDING")
            else:
                self.assertEqual(status, "MISSED")

    def test_get_productivity_metrics_and_route(self):
        # Insert test session data for last 7 days
        yesterday_start = datetime.now() - timedelta(days=1)
        yesterday_end = yesterday_start + timedelta(hours=2)
        
        db.session.execute(
            text(
                "INSERT INTO study_sessions (student_id, subject_id, start_time, end_time, duration_min, completed) "
                "VALUES (:uid, :subid, :start, :end, 120, 1)"
            ),
            {"uid": self.user_id, "subid": self.subject_id, "start": yesterday_start, "end": yesterday_end}
        )
        db.session.commit()

        # Test helper directly
        metrics = get_productivity_metrics(self.user_id, days=7)
        self.assertIn("total_sessions", metrics)
        self.assertIn("completed_sessions", metrics)
        self.assertIn("focus_ratio_pct", metrics)
        self.assertEqual(metrics["total_sessions"], 1)
        self.assertEqual(metrics["completed_sessions"], 1)
        self.assertEqual(metrics["focus_ratio_pct"], 100.0)

        # Test route endpoint
        response = self.client.get(
            "/api/tracking/metrics?days=7",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        res_data = data["data"]
        self.assertIn("total_sessions", res_data)
        self.assertIn("completed_sessions", res_data)
        self.assertIn("daily_log", res_data)
        self.assertEqual(len(res_data["daily_log"]), 7)


if __name__ == "__main__":
    unittest.main()
