import unittest
import json
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.auth_service import ensure_mentor_applications_table


class MentorApplicationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        # Clean up existing test records
        db.session.execute(text("DELETE FROM users WHERE email LIKE 'test_%'"))
        db.session.commit()

        # Create admin user for testing approvals endpoints
        db.session.execute(
            text(
                "INSERT INTO users (name, email, password_hash, role, status) "
                "VALUES ('Test Admin', 'test_admin@learnify.com', 'dummy_hash', 'admin', 'active')"
            )
        )
        db.session.commit()

        # Get test admin's user ID
        row = db.session.execute(
            text("SELECT id FROM users WHERE email = 'test_admin@learnify.com'")
        ).fetchone()
        self.admin_id = row[0]

        # Generate admin JWT headers
        self.admin_access_token = create_access_token(
            identity=str(self.admin_id),
            additional_claims={"role": "admin"}
        )
        self.admin_headers = {
            "Authorization": f"Bearer {self.admin_access_token}",
            "Content-Type": "application/json"
        }

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM mentor_applications WHERE qualifications = 'MSc Software Engineering'"))
        db.session.execute(text("DELETE FROM notifications WHERE title LIKE '%Mentor%'"))
        db.session.execute(text("DELETE FROM users WHERE email LIKE 'test_%'"))
        db.session.commit()
        self.app_context.pop()

    def test_mentor_registration_and_approval_workflow(self):
        # 1. Register user as a mentor
        reg_payload = {
            "name": "Test Candidate",
            "email": "test_candidate@learnify.com",
            "password": "Password123!",
            "role": "mentor",
            "qualifications": "MSc Software Engineering",
            "certifications": "AWS Solutions Architect"
        }
        
        response = self.client.post(
            "/auth/register",
            data=json.dumps(reg_payload),
            headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        
        candidate_id = data["data"]["user"]["id"]
        candidate_role = data["data"]["user"]["role"]
        
        # Verify the user has student access role initially
        self.assertEqual(candidate_role, "student")
        
        # Verify the mentor application is registered and pending
        ensure_mentor_applications_table()
        app_row = db.session.execute(
            text("SELECT qualifications, certifications, status FROM mentor_applications WHERE user_id = :uid"),
            {"uid": candidate_id}
        ).fetchone()
        
        self.assertIsNotNone(app_row)
        self.assertEqual(app_row[0], "MSc Software Engineering")
        self.assertEqual(app_row[1], "AWS Solutions Architect")
        self.assertEqual(app_row[2], "pending")

        # 2. Get pending approvals list as admin
        list_res = self.client.get(
            "/api/admin/approvals/pending",
            headers=self.admin_headers
        )
        self.assertEqual(list_res.status_code, 200)
        list_data = json.loads(list_res.data.decode("utf-8"))
        self.assertTrue(list_data["success"])
        
        # Verify candidate is in the pending applications list
        pending_emails = [u["email"] for u in list_data["data"]["users"]]
        self.assertIn("test_candidate@learnify.com", pending_emails)

        # 3. Approve candidate as admin
        approve_res = self.client.post(
            f"/api/admin/approvals/{candidate_id}/approve",
            headers=self.admin_headers
        )
        self.assertEqual(approve_res.status_code, 200)
        approve_data = json.loads(approve_res.data.decode("utf-8"))
        self.assertTrue(approve_data["success"])
        
        # Verify database changes
        db.session.expire_all()
        # Verify role has updated to mentor
        role_row = db.session.execute(
            text("SELECT role FROM users WHERE id = :uid"),
            {"uid": candidate_id}
        ).fetchone()
        self.assertEqual(role_row[0], "mentor")
        
        # Verify application status updated to approved
        app_status_row = db.session.execute(
            text("SELECT status FROM mentor_applications WHERE user_id = :uid"),
            {"uid": candidate_id}
        ).fetchone()
        self.assertEqual(app_status_row[0], "approved")

        # Verify notification created
        notif_row = db.session.execute(
            text("SELECT id FROM notifications WHERE user_id = :uid AND title = 'Mentor Account Approved'"),
            {"uid": candidate_id}
        ).fetchone()
        self.assertIsNotNone(notif_row)


if __name__ == "__main__":
    unittest.main()
