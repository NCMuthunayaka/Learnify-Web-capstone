from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("chat", __name__)

# Mock chat storage
CONVERSATIONS = {
    1: {
        "id": 1,
        "user_id": 1,
        "title": "Learning Python",
        "created_at": datetime.now().isoformat(),
        "messages": []
    }
}

MESSAGES = {}
MESSAGE_ID = 1

@bp.route("/messages", methods=["POST"])
def send_message():
    """Send a chat message"""
    global MESSAGE_ID
    data = request.get_json()
    message_text = data.get("message")
    conversation_id = data.get("conversation_id", 1)
    
    message = {
        "id": MESSAGE_ID,
        "conversation_id": conversation_id,
        "sender": "user",
        "content": message_text,
        "timestamp": datetime.now().isoformat()
    }
    MESSAGE_ID += 1
    
    MESSAGES[message["id"]] = message
    return jsonify({"success": True, "message": message}), 201

@bp.route("/conversations", methods=["GET"])
def get_conversations():
    """Get all user conversations"""
    return jsonify({
        "success": True,
        "conversations": list(CONVERSATIONS.values())
    }), 200

@bp.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation_messages(conversation_id):
    """Get messages for a specific conversation"""
    conversation = CONVERSATIONS.get(conversation_id)
    if not conversation:
        return jsonify({"success": False, "error": "Conversation not found"}), 404
    
    conv_messages = [msg for msg in MESSAGES.values() 
                     if msg.get("conversation_id") == conversation_id]
    
    return jsonify({
        "success": True,
        "conversation": conversation,
        "messages": conv_messages
    }), 200
