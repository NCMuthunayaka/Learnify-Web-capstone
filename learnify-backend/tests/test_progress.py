import unittest
import json
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.analytics_service import ensure_student_profile


class ProgressTestCase(unittest.TestCase):
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

    def test_progress_summary_endpoint(self):
        response = self.client.get(
            "/api/progress/summary",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        
        # Verify all required progress summary fields are present
        res_data = data["data"]
        self.assertIn("stats", res_data)
        self.assertIn("streak_days", res_data)
        self.assertIn("study_chart", res_data)
        self.assertIn("time_alloc", res_data)
        self.assertIn("subject_progress", res_data)
        self.assertIn("heatmap", res_data)
        self.assertIn("tasks", res_data)
        self.assertIn("leaderboard", res_data)
        self.assertIn("recent_activity", res_data)
        self.assertIn("monthly_scores", res_data)


if __name__ == "__main__":
    unittest.main()
