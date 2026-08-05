from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

bp = Blueprint("auth", __name__)

# Mock database of users
USERS_DB = {
    "test@example.com": {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmGEJiq",  # password123
    }
}

@bp.route("/login", methods=["POST"])
def login():
    """User login endpoint"""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    user = USERS_DB.get(email)
    if user:
        return jsonify({
            "success": True,
            "token": "mock_jwt_token_" + str(user["id"]),
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"]
            }
        }), 200
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@bp.route("/register", methods=["POST"])
def register():
    """User registration endpoint"""
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    
    if email in USERS_DB:
        return jsonify({"success": False, "error": "Email already exists"}), 409
    
    user_id = len(USERS_DB) + 1
    USERS_DB[email] = {
        "id": user_id,
        "email": email,
        "name": name,
        "password_hash": "hashed_" + password
    }
    
    return jsonify({
        "success": True,
        "user": {
            "id": user_id,
            "email": email,
            "name": name
        }
    }), 201

@bp.route("/me", methods=["GET"])
def get_current_user():
    """Get current authenticated user"""
    # Mock implementation
    return jsonify({
        "success": True,
        "user": {
            "id": 1,
            "email": "test@example.com",
            "name": "Test User"
        }
    }), 200

@bp.route("/logout", methods=["POST"])
def logout():
    """User logout endpoint"""
    return jsonify({"success": True, "message": "Logged out successfully"}), 200
