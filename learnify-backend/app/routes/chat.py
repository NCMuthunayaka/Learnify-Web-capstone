"""
Chat Routes — /api/chat
Handles AI chat sessions, message history, text messages, and file uploads.
Primary AI: Gemini 1.5 Flash  |  Fallback: GPT-4
"""
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.chat_message import ChatSession, ChatMessage
from app.utils.response_utils import success_response, error_response
from app.services.ai_service import get_ai_response

bp = Blueprint("chat", __name__)

# Allowed file types for upload
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "webp"}
MIME_MAP = {
    "pdf":  "application/pdf",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "gif":  "image/gif",
    "webp": "image/webp",
}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _get_mime(filename: str) -> str:
    ext = filename.rsplit(".", 1)[1].lower()
    return MIME_MAP.get(ext, "application/octet-stream")


def _build_history(session: ChatSession) -> list:
    """Build conversation history list from DB messages."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages[-20:]   # last 20 for context
    ]


# ── POST /api/chat/sessions ───────────────────────────────────────────────────
# Create a new chat session
@bp.route("/sessions", methods=["POST"])
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}
    title   = data.get("title", "New Chat")

    session = ChatSession(user_id=user_id, title=title)
    db.session.add(session)
    db.session.commit()

    # Add the standard greeting message from the assistant
    greeting = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=(
            "Hi there! I'm your Learnify AI study assistant. "
            "I can help you plan your schedule, answer subject questions, "
            "analyse documents, or guide your revision. What would you like to work on today?"
        ),
    )
    db.session.add(greeting)
    db.session.commit()

    return success_response(
        data={"session": session.to_dict(), "greeting": greeting.to_dict()},
        message="Chat session created",
        status=201,
    )


# ── GET /api/chat/sessions ────────────────────────────────────────────────────
# List all sessions for the current user
@bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id  = int(get_jwt_identity())
    sessions = (
        ChatSession.query
        .filter_by(user_id=user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return success_response(data={"sessions": [s.to_dict() for s in sessions]})


# ── GET /api/chat/sessions/<id>/messages ─────────────────────────────────────
# Retrieve full message history for a session
@bp.route("/sessions/<int:session_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(session_id):
    user_id = int(get_jwt_identity())
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()

    if not session:
        return error_response("NOT_FOUND", "Chat session not found", status=404)

    return success_response(data={
        "session":  session.to_dict(),
        "messages": [m.to_dict() for m in session.messages],
    })


# ── POST /api/chat/sessions/<id>/messages ────────────────────────────────────
# Send a text message and get an AI reply
@bp.route("/sessions/<int:session_id>/messages", methods=["POST"])
@jwt_required()
def send_message(session_id):
    user_id = int(get_jwt_identity())
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()

    if not session:
        return error_response("NOT_FOUND", "Chat session not found", status=404)

    data    = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return error_response("MISSING_FIELD", "Message content is required", status=400)

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=content)
    db.session.add(user_msg)
    db.session.commit()

    # Build history and call AI
    history = _build_history(session)

    try:
        ai_text = get_ai_response(
            user_message=content,
            history=history[:-1],   # exclude the message we just added (already in user_msg)
        )
    except RuntimeError as e:
        return error_response("AI_ERROR", str(e), status=503)

    # Save AI reply
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_text)
    db.session.add(ai_msg)

    # Update session title from first user message
    if len(session.messages) <= 2:
        session.title = content[:80]

    db.session.commit()

    return success_response(data={
        "user_message": user_msg.to_dict(),
        "ai_message":   ai_msg.to_dict(),
    })


# ── POST /api/chat/sessions/<id>/upload ──────────────────────────────────────
# Upload a file (PDF or image), get AI analysis as a chat reply
@bp.route("/sessions/<int:session_id>/upload", methods=["POST"])
@jwt_required()
def upload_file(session_id):
    user_id = int(get_jwt_identity())
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()

    if not session:
        return error_response("NOT_FOUND", "Chat session not found", status=404)

    if "file" not in request.files:
        return error_response("MISSING_FILE", "No file provided", status=400)

    file = request.files["file"]
    if not file.filename or not _allowed_file(file.filename):
        return error_response(
            "INVALID_FILE",
            "Only PDF, PNG, JPG, GIF, and WEBP files are supported",
            status=400,
        )

    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        return error_response("FILE_TOO_LARGE", "File must be under 10 MB", status=413)

    mime_type   = _get_mime(file.filename)
    ext         = file.filename.rsplit(".", 1)[1].lower()
    file_type   = "pdf" if ext == "pdf" else "image"
    caption     = (request.form.get("caption") or "").strip()
    user_prompt = caption if caption else f"Please analyse this {file_type} and summarise the key academic content."

    # Save user message with file reference
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_prompt,
        file_name=file.filename,
        file_type=file_type,
    )
    db.session.add(user_msg)
    db.session.commit()

    # Build history and call AI with file
    history = _build_history(session)

    try:
        ai_text = get_ai_response(
            user_message=user_prompt,
            history=history[:-1],
            file_data=file_bytes,
            file_mime=mime_type,
        )
    except RuntimeError as e:
        return error_response("AI_ERROR", str(e), status=503)

    # Save AI reply
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_text)
    db.session.add(ai_msg)

    if len(session.messages) <= 2:
        session.title = f"File: {file.filename[:60]}"

    db.session.commit()

    return success_response(data={
        "user_message": user_msg.to_dict(),
        "ai_message":   ai_msg.to_dict(),
    })
