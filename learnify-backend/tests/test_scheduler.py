import unittest
import json
from datetime import date, datetime, timedelta
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.analytics_service import ensure_student_profile


class SchedulerTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        # Clean up existing test records
        db.session.execute(text("DELETE FROM tasks WHERE title LIKE 'test_%'"))
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

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM tasks WHERE student_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM student_subjects WHERE student_id = :spid"), {"spid": self.profile_id})
        db.session.execute(text("DELETE FROM student_profiles WHERE user_id = :uid"), {"uid": self.user_id})
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_create_task_happy_path(self):
        payload = {
            "title": "test_create_task_happy",
            "subject_id": self.subject_id,
            "due_date": "2026-07-15",
            "type": "project"
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["task"]["title"], "test_create_task_happy")
        self.assertEqual(data["data"]["task"]["subject_id"], self.subject_id)
        self.assertEqual(data["data"]["task"]["due_date"], "2026-07-15")
        self.assertEqual(data["data"]["task"]["type"], "project")
        self.assertEqual(data["data"]["task"]["status"], "todo")
        self.assertEqual(data["data"]["task"]["completion_pct"], 0)

    def test_create_task_missing_fields(self):
        # Missing title
        payload = {
            "subject_id": self.subject_id,
            "due_date": "2026-07-15"
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode("utf-8"))
        self.assertFalse(data["success"])

        # Missing subject_id
        payload = {
            "title": "test_missing_subject",
            "due_date": "2026-07-15"
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Missing due_date
        payload = {
            "title": "test_missing_date",
            "subject_id": self.subject_id
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

    def test_create_task_invalid_subject(self):
        payload = {
            "title": "test_invalid_subject",
            "subject_id": 99999, # non-existent
            "due_date": "2026-07-15"
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode("utf-8"))
        self.assertFalse(data["success"])

    def test_create_task_invalid_date(self):
        # Invalid date format
        payload = {
            "title": "test_invalid_date",
            "subject_id": self.subject_id,
            "due_date": "2026/07/15" # slash instead of dash
        }
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Non-date string
        payload["due_date"] = "not-a-date"
        response = self.client.post(
            "/api/scheduler/tasks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

    def test_get_tasks(self):
        # Create two tasks first
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_1', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_2', 'exam', '2026-07-02', 'done', 100)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        # Get all tasks
        response = self.client.get("/api/scheduler/tasks", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["tasks"]), 2)

        # Filter by status = done
        response = self.client.get("/api/scheduler/tasks?status=done", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(len(data["data"]["tasks"]), 1)
        self.assertEqual(data["data"]["tasks"][0]["title"], "test_task_2")

    def test_update_task_happy_path(self):
        # Create a task
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_update', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        task_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Update title and type
        payload = {
            "title": "test_task_updated",
            "type": "exam"
        }
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])

        # Check DB directly
        row = db.session.execute(
            text("SELECT title, type FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "test_task_updated")
        self.assertEqual(row[1], "exam")

    def test_update_task_sync_status_completion(self):
        # Create a task
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_sync', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        task_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # 1. Update status to 'done' -> should auto set completion_pct to 100
        payload = {"status": "done"}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "done")
        self.assertEqual(row[1], 100)

        # 2. Update status to 'in_progress' -> should auto set completion_pct to 50
        payload = {"status": "in_progress"}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "in_progress")
        self.assertEqual(row[1], 50)

        # 3. Update completion_pct to 100 -> should auto set status to 'done'
        payload = {"completion_pct": 100}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "done")
        self.assertEqual(row[1], 100)

        # 4. Update completion_pct to 0 -> should auto set status to 'todo'
        payload = {"completion_pct": 0}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "todo")
        self.assertEqual(row[1], 0)

        # 5. Update completion_pct to 75 -> should auto set status to 'in_progress'
        payload = {"completion_pct": 75}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "in_progress")
        self.assertEqual(row[1], 75)

    def test_update_task_invalid_fields(self):
        # Create a task
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_invalid_up', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        task_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Invalid completion_pct (< 0)
        payload = {"completion_pct": -5}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Invalid completion_pct (> 100)
        payload = {"completion_pct": 120}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Invalid status value
        payload = {"status": "not_a_status"}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Invalid subject_id
        payload = {"subject_id": 99999}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

        # Invalid due_date format
        payload = {"due_date": "invalid_date_format"}
        response = self.client.put(
            f"/api/scheduler/tasks/{task_id}",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 400)

    def test_update_task_status_happy_path(self):
        # Create a task
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_patch', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        task_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Update status to done
        payload = {"status": "done"}
        response = self.client.patch(
            f"/api/scheduler/tasks/{task_id}/status",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        
        row = db.session.execute(
            text("SELECT status, completion_pct FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).fetchone()
        self.assertEqual(row[0], "done")
        self.assertEqual(row[1], 100)

    def test_delete_task(self):
        # Create a task
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, due_date, status, completion_pct) "
                "VALUES (:uid, :subid, 'test_task_delete', 'assignment', '2026-07-01', 'todo', 0)"
            ),
            {"uid": self.user_id, "subid": self.subject_id}
        )
        db.session.commit()

        task_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Delete the task
        response = self.client.delete(f"/api/scheduler/tasks/{task_id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)

        # Check DB to confirm deleted
        cnt = db.session.execute(
            text("SELECT COUNT(*) FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        ).scalar()
        self.assertEqual(cnt, 0)

        # Delete again -> should return 404
        response = self.client.delete(f"/api/scheduler/tasks/{task_id}", headers=self.headers)
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
