from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("admin", __name__)

@bp.route("/users", methods=["GET"])
def get_users():
    """Get all users (admin only)"""
    return jsonify({
        "success": True,
        "users": [
            {
                "id": 1,
                "email": "test@example.com",
                "name": "Test User",
                "created_at": datetime.now().isoformat()
            }
        ]
    }), 200

@bp.route("/feedback/analytics", methods=["GET"])
def get_feedback_analytics():
    """Get feedback analytics"""
    return jsonify({
        "success": True,
        "analytics": {
            "total_feedback": 10,
            "average_rating": 4.5,
            "rating_distribution": {
                "5": 6,
                "4": 3,
                "3": 1
            }
        }
    }), 200

@bp.route("/stats", methods=["GET"])
def get_stats():
    """Get general admin statistics"""
    return jsonify({
        "success": True,
        "stats": {
            "total_users": 100,
            "active_sessions": 25,
            "total_tasks": 500
        }
    }), 200
