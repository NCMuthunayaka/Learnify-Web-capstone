import unittest
import json
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.analytics_service import ensure_student_profile


class DashboardTestCase(unittest.TestCase):
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

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM student_profiles WHERE user_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_dashboard_stats_endpoint(self):
        response = self.client.get(
            "/api/dashboard/stats",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertIn("stats", data["data"])
        self.assertIn("analytics", data["data"])
        self.assertIn("weekly_chart", data["data"])
        self.assertIn("deadlines", data["data"])
        self.assertIn("scheduled_subjects", data["data"])


if __name__ == "__main__":
    unittest.main()
