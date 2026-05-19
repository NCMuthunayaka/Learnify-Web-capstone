from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.utils.response_utils import success_response, error_response

bp = Blueprint("auth", __name__)

@bp.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.json
        
        # Validate input
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirmPassword", "")
        role = data.get("role", "student")
        
        # Validation errors
        errors = AuthService.validate_registration_data(
            first_name,
            last_name,
            email,
            password,
            confirm_password
        )
        
        if errors:
            return error_response("Validation failed", errors, None, 400)
        
        if role not in ["student", "mentor"]:
            return error_response("Invalid role", "Role must be 'student' or 'mentor'", None, 400)
        
        # Register user
        result = AuthService.register(first_name, last_name, email, password, role)

        return success_response(
            {
                "user": result["user"],
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
            },
            "Registration successful",
            201
        )        
        return success_response(
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role
            },
            "Registration successful",
            201
        )
    
    except ValueError as e:
        return error_response("Registration failed", str(e), None, 400)
    except Exception as e:
        return error_response("Internal server error", str(e), None, 500)

@bp.route("/login", methods=["POST"])
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get("email", "").strip()
        password = data.get("password", "")
        
        if not email or not password:
            return error_response("Invalid input", "Email and password required", None, 400)
        
        result = AuthService.login(email, password)
        
        return success_response(
            result,
            "Login successful",
            200
        )
    
    except ValueError as e:
        return error_response("Login failed", str(e), None, 401)
    except Exception as e:
        return error_response("Internal server error", str(e), None, 500)

@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        user = AuthService.get_user(user_id)
        
        from flask_jwt_extended import create_access_token
        from datetime import timedelta
        
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(minutes=15)
        )
        
        return success_response(
            {"access_token": access_token},
            "Token refreshed",
            200
        )
    
    except Exception as e:
        return error_response("Token refresh failed", str(e), None, 401)

@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        user = AuthService.get_user(user_id)
        
        return success_response(
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "avatar_url": user.avatar_url
            },
            "User retrieved",
            200
        )
    
    except Exception as e:
        return error_response("Failed to retrieve user", str(e), None, 401)
