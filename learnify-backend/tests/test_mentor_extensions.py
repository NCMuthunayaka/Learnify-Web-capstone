import unittest
import json
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db


class MentorExtensionsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        # Clean up existing test records
        db.session.execute(text("DELETE FROM users WHERE email LIKE 'test_%'"))
        db.session.commit()

        # Create a test mentor user
        db.session.execute(
            text(
                "INSERT INTO users (name, email, password_hash, role, status) "
                "VALUES ('Test Mentor', 'test_mentor@learnify.com', 'dummy_hash', 'mentor', 'active')"
            )
        )
        db.session.commit()

        # Get test mentor's user ID
        row = db.session.execute(
            text("SELECT id FROM users WHERE email = 'test_mentor@learnify.com'")
        ).fetchone()
        self.user_id = row[0]

        # Generate JWT headers with role claim
        self.access_token = create_access_token(
            identity=str(self.user_id),
            additional_claims={"role": "mentor"}
        )
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM mentor_profiles WHERE user_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_mentor_dashboard_stats_endpoint(self):
        response = self.client.get(
            "/api/mentor/dashboard/stats",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertIn("profile", data["data"])
        self.assertIn("achievements", data["data"])
        self.assertIn("ai_insights", data["data"])

    def test_log_mentor_work_session(self):
        # Log a work session
        response = self.client.post(
            "/api/mentor/work-session",
            data=json.dumps({"duration": 25, "category": "Lesson Prep"}),
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["total_points"], 10)
        self.assertEqual(data["data"]["response_streak_days"], 1)

    def test_mentor_support_ticket(self):
        # Create a support ticket
        response = self.client.post(
            "/api/mentor/support",
            data=json.dumps({"title": "Glitch in availability", "description": "My hours from 10-12 are not saving."}),
            headers=self.headers
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])


if __name__ == "__main__":
    unittest.main()
