from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("resources", __name__)

# Mock resources storage
RESOURCES = {
    1: {
        "id": 1,
        "title": "Python Fundamentals",
        "description": "Learn Python basics",
        "url": "https://example.com/python",
        "category": "programming",
        "created_at": datetime.now().isoformat()
    }
}

RESOURCE_ID = 2

@bp.route("", methods=["GET"])
def get_resources():
    """Get all resources"""
    return jsonify({
        "success": True,
        "resources": list(RESOURCES.values())
    }), 200

@bp.route("", methods=["POST"])
def create_resource():
    """Create a new resource"""
    global RESOURCE_ID
    data = request.get_json()
    
    resource = {
        "id": RESOURCE_ID,
        "title": data.get("title"),
        "description": data.get("description", ""),
        "url": data.get("url"),
        "category": data.get("category", "general"),
        "created_at": datetime.now().isoformat()
    }
    RESOURCE_ID += 1
    RESOURCES[resource["id"]] = resource
    
    return jsonify({"success": True, "resource": resource}), 201
