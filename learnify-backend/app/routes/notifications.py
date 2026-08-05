from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("notifications", __name__)

# Mock notifications storage
NOTIFICATIONS = {
    1: {
        "id": 1,
        "user_id": 1,
        "title": "Task Reminder",
        "message": "You have a task scheduled for today",
        "type": "reminder",
        "read": False,
        "created_at": datetime.now().isoformat()
    }
}

NOTIFICATION_ID = 2

@bp.route("", methods=["GET"])
def get_notifications():
    """Get user notifications"""
    return jsonify({
        "success": True,
        "notifications": list(NOTIFICATIONS.values())
    }), 200

@bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_as_read(notification_id):
    """Mark notification as read"""
    notification = NOTIFICATIONS.get(notification_id)
    
    if not notification:
        return jsonify({"success": False, "error": "Notification not found"}), 404
    
    notification["read"] = True
    return jsonify({"success": True, "notification": notification}), 200
