from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app.services.auth_service import register_user, login_user, google_auth_user
from app.utils.response_utils import success_response, error_response
from app.models.user import User 

bp = Blueprint("auth", __name__)


# ── Register ──────────────────────────────────────────────
@bp.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    required = ["name", "email", "password", "role"]

    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    if data["role"] not in ["student", "mentor"]:
        return error_response("INVALID_ROLE", "Role must be student or mentor", "role", 400)

    user, err = register_user(
        name     = data["name"],
        email    = data["email"],
        password = data["password"],
        role     = data["role"],
    )

    if err:
        return error_response("REGISTRATION_FAILED", err, status=400)

    access_token  = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response(
        data={
            "user":          user.to_dict(),
            "access_token":  access_token,
            "refresh_token": refresh_token,
        },
        message="Registration successful",
        status=201,
    )


# ── Login ─────────────────────────────────────────────────
@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return error_response("MISSING_FIELD", "Email and password are required", status=400)

    user, err = login_user(data["email"], data["password"])

    if err:
        return error_response("LOGIN_FAILED", err, status=401)

    access_token  = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response(
        data={
            "user":          user.to_dict(),
            "access_token":  access_token,
            "refresh_token": refresh_token,
        },
        message="Login successful",
    )


# ── Google Auth ───────────────────────────────────────────
@bp.route("/google", methods=["POST"])
def google_login():
    data         = request.get_json()
    google_token = data.get("token")

    if not google_token:
        return error_response("MISSING_FIELD", "Google token is required", status=400)

    # Now returns 3 values — user, is_new_user, error
    user, is_new_user, err = google_auth_user(google_token)

    if err:
        return error_response("GOOGLE_AUTH_FAILED", err, status=401)

    access_token  = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response(
        data={
            "user":          user.to_dict(),
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "is_new_user":   is_new_user,  # 👈 frontend uses this
        },
        message="Google login successful",
    )

# ── Get Current User ──────────────────────────────────────
@bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())


# ── Refresh Token ─────────────────────────────────────────
@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return success_response(data={"access_token": access_token})