from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint("scheduler", __name__)

# Mock tasks storage
TASKS = {
    1: {
        "id": 1,
        "user_id": 1,
        "title": "Learn Python Basics",
        "description": "Complete Python fundamentals course",
        "scheduled_start": "2026-05-20T10:00:00",
        "scheduled_end": "2026-05-20T12:00:00",
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
}

TASK_ID = 2

@bp.route("/tasks", methods=["GET"])
def get_tasks():
    """Get all user tasks"""
    return jsonify({
        "success": True,
        "tasks": list(TASKS.values())
    }), 200

@bp.route("/tasks", methods=["POST"])
def create_task():
    """Create a new task"""
    global TASK_ID
    data = request.get_json()
    
    task = {
        "id": TASK_ID,
        "user_id": 1,
        "title": data.get("title"),
        "description": data.get("description", ""),
        "scheduled_start": data.get("scheduled_start"),
        "scheduled_end": data.get("scheduled_end"),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    TASK_ID += 1
    TASKS[task["id"]] = task
    
    return jsonify({"success": True, "task": task}), 201

@bp.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    """Update a task"""
    data = request.get_json()
    task = TASKS.get(task_id)
    
    if not task:
        return jsonify({"success": False, "error": "Task not found"}), 404
    
    task.update({
        "title": data.get("title", task["title"]),
        "description": data.get("description", task["description"]),
        "scheduled_start": data.get("scheduled_start", task["scheduled_start"]),
        "scheduled_end": data.get("scheduled_end", task["scheduled_end"]),
        "status": data.get("status", task["status"])
    })
    
    return jsonify({"success": True, "task": task}), 200

@bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task"""
    if task_id in TASKS:
        del TASKS[task_id]
        return jsonify({"success": True, "message": "Task deleted"}), 200
    
    return jsonify({"success": False, "error": "Task not found"}), 404
