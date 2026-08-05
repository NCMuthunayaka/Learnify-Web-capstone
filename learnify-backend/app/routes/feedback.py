from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("feedback", __name__)

# Mock feedback storage
FEEDBACK_DATA = {
    1: {
        "id": 1,
        "user_id": 1,
        "rating": 5,
        "comment": "Great learning experience!",
        "created_at": datetime.now().isoformat()
    }
}

FEEDBACK_ID = 2

@bp.route("", methods=["GET"])
def get_feedback():
    """Get user feedback"""
    return jsonify({
        "success": True,
        "feedback": list(FEEDBACK_DATA.values())
    }), 200

@bp.route("", methods=["POST"])
def create_feedback():
    """Create feedback"""
    global FEEDBACK_ID
    data = request.get_json()
    
    feedback = {
        "id": FEEDBACK_ID,
        "user_id": 1,
        "rating": data.get("rating"),
        "comment": data.get("comment", ""),
        "created_at": datetime.now().isoformat()
    }
    FEEDBACK_ID += 1
    FEEDBACK_DATA[feedback["id"]] = feedback
    
    return jsonify({"success": True, "feedback": feedback}), 201
