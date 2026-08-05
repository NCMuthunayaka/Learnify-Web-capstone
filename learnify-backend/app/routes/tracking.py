from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("tracking", __name__)

# Mock tracking storage
TRACKING_DATA = {
    1: {
        "id": 1,
        "user_id": 1,
        "session_id": 1,
        "duration": 3600,
        "timestamp": datetime.now().isoformat(),
        "activity": "learning"
    }
}

TRACKING_ID = 2

@bp.route("/records", methods=["GET"])
def get_tracking_records():
    """Get tracking records"""
    return jsonify({
        "success": True,
        "records": list(TRACKING_DATA.values())
    }), 200

@bp.route("/records", methods=["POST"])
def create_tracking_record():
    """Create a tracking record"""
    global TRACKING_ID
    data = request.get_json()
    
    record = {
        "id": TRACKING_ID,
        "user_id": 1,
        "session_id": data.get("session_id"),
        "duration": data.get("duration", 0),
        "timestamp": datetime.now().isoformat(),
        "activity": data.get("activity", "learning")
    }
    TRACKING_ID += 1
    TRACKING_DATA[record["id"]] = record
    
    return jsonify({"success": True, "record": record}), 201
