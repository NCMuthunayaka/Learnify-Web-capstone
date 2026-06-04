from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app.services.auth_service import register_user, login_user

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    data = request.get_json()
    first_name = (data.get("firstName") or "").strip()
    last_name  = (data.get("lastName") or "").strip()
    email      = (data.get("email") or "").strip().lower()
    password   = data.get("password") or ""
    role       = data.get("role") or "student"

    if not all([first_name, last_name, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    name = f"{first_name} {last_name}"
    user, error = register_user(name, email, password, role)
    if error:
        return jsonify({"error": error}), 409

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 201


@bp.post("/login")
def login():
    data     = request.get_json()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user, error = login_user(email, password)
    if error:
        return jsonify({"error": error}), 401

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 200


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity     = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


@bp.get("/me")
@jwt_required()
def me():
    from app.models.user import User
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
