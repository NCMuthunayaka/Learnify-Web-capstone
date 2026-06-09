from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.utils.response_utils import success_response, error_response

bp = Blueprint("users", __name__)


# ── GET /api/users/profile ────────────────────────────────
@bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())


# ── PATCH /api/users/profile ──────────────────────────────
@bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    data = request.get_json()

    # All fields that can be updated
    allowed_fields = [
        "name",
        "phone",
        "bio",
        "student_id",
        "university",
        "faculty",
        "year",
        "avatar_url",
        "role",
    ]

    updated = False
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
            updated = True

    if not updated:
        return error_response(
            "NO_CHANGES",
            "No valid fields provided to update",
            status=400
        )

    db.session.commit()

    return success_response(
        data=user.to_dict(),
        message="Profile updated successfully"
    )


# ── PATCH /api/users/change-password ─────────────────────
@bp.route("/change-password", methods=["PATCH"])
@jwt_required()
def change_password():
    from app.extensions import bcrypt

    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    data = request.get_json()

    if not data.get("current_password") or not data.get("new_password"):
        return error_response(
            "MISSING_FIELD",
            "current_password and new_password are required",
            status=400
        )

    if not bcrypt.check_password_hash(user.password_hash, data["current_password"]):
        return error_response(
            "INVALID_PASSWORD",
            "Current password is incorrect",
            status=400
        )

    if len(data["new_password"]) < 6:
        return error_response(
            "WEAK_PASSWORD",
            "New password must be at least 6 characters",
            status=400
        )

    user.password_hash = bcrypt.generate_password_hash(
        data["new_password"]
    ).decode("utf-8")

    db.session.commit()

    return success_response(message="Password changed successfully")


# ── GET /api/users/<id> ───────────────────────────────────
@bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    claims = get_jwt()
    role   = claims.get("role")

    if role != "admin":
        return error_response("FORBIDDEN", "Admin access required", status=403)

    user = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())