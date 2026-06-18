import unittest
import json
import io
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from app import create_app
from app.extensions import db


class ChatTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        # Clean up existing test records
        db.session.execute(text("DELETE FROM chat_messages"))
        db.session.execute(text("DELETE FROM chat_sessions"))
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

    def tearDown(self):
        # Clean up test database records
        db.session.execute(text("DELETE FROM chat_messages"))
        db.session.execute(text("DELETE FROM chat_sessions"))
        db.session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": self.user_id})
        db.session.commit()
        self.app_context.pop()

    def test_create_session(self):
        payload = {"title": "test_chat_session"}
        response = self.client.post(
            "/api/chat/sessions",
            headers=self.headers,
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["session"]["title"], "test_chat_session")
        self.assertEqual(data["data"]["session"]["user_id"], self.user_id)
        
        # Verify that assistant's greeting is saved
        self.assertIsNotNone(data["data"]["greeting"])
        self.assertEqual(data["data"]["greeting"]["role"], "assistant")

    def test_list_sessions(self):
        # Insert a test session first
        db.session.execute(
            text("INSERT INTO chat_sessions (user_id, title) VALUES (:uid, 'test_chat_1')"),
            {"uid": self.user_id}
        )
        db.session.commit()

        response = self.client.get("/api/chat/sessions", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["sessions"]), 1)
        self.assertEqual(data["data"]["sessions"][0]["title"], "test_chat_1")

    def test_get_messages(self):
        # Insert session and a greeting message
        db.session.execute(
            text("INSERT INTO chat_sessions (user_id, title) VALUES (:uid, 'test_chat_messages')"),
            {"uid": self.user_id}
        )
        db.session.commit()
        
        sess_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        
        db.session.execute(
            text("INSERT INTO chat_messages (session_id, role, content) VALUES (:sid, 'assistant', 'Hello Test!')"),
            {"sid": sess_id}
        )
        db.session.commit()

        response = self.client.get(f"/api/chat/sessions/{sess_id}/messages", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["messages"]), 1)
        self.assertEqual(data["data"]["messages"][0]["content"], "Hello Test!")

    def test_send_message(self):
        # Insert a session
        db.session.execute(
            text("INSERT INTO chat_sessions (user_id, title) VALUES (:uid, 'test_chat_send')"),
            {"uid": self.user_id}
        )
        db.session.commit()
        
        sess_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Send a message
        payload = {"content": "Solve 2+2"}
        # Note: This will call get_ai_response which talks to Gemini API.
        # Since it runs in development, it might run Gemini, or fail if GEMINI_API_KEY is not set.
        # Let's verify how the API behaves if key is missing or invalid.
        # If Gemini key is missing, it raises error which returns 503 (AI_ERROR).
        # We can assert for either 200 or 503 depending on AI configuration.
        response = self.client.post(
            f"/api/chat/sessions/{sess_id}/messages",
            headers=self.headers,
            data=json.dumps(payload)
        )
        
        self.assertIn(response.status_code, [200, 503])
        data = json.loads(response.data.decode("utf-8"))
        
        if response.status_code == 200:
            self.assertTrue(data["success"])
            self.assertIn("user_message", data["data"])
            self.assertIn("ai_message", data["data"])
            self.assertEqual(data["data"]["user_message"]["content"], "Solve 2+2")
        else:
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_ERROR")

    def test_upload_file(self):
        # Insert a session
        db.session.execute(
            text("INSERT INTO chat_sessions (user_id, title) VALUES (:uid, 'test_chat_upload')"),
            {"uid": self.user_id}
        )
        db.session.commit()
        
        sess_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Create dummy file bytes (e.g. dummy image or PDF)
        dummy_file = (io.BytesIO(b"dummy image data"), "test.png")
        
        # Make multipart request
        response = self.client.post(
            f"/api/chat/sessions/{sess_id}/upload",
            headers={"Authorization": f"Bearer {self.access_token}"},
            data={
                "file": dummy_file,
                "caption": "Describe this image"
            }
        )
        
        self.assertIn(response.status_code, [200, 503])
        data = json.loads(response.data.decode("utf-8"))
        
        if response.status_code == 200:
            self.assertTrue(data["success"])
            self.assertIn("user_message", data["data"])
            self.assertIn("ai_message", data["data"])
            self.assertEqual(data["data"]["user_message"]["file_name"], "test.png")
            self.assertEqual(data["data"]["user_message"]["file_type"], "image")
        else:
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_ERROR")


if __name__ == "__main__":
    unittest.main()
