from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.utils.response_utils import success_response, error_response

bp = Blueprint("users", __name__)


@bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())


@bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    data = request.get_json()

    # ── All updatable fields for both roles ───────────────
    allowed_fields = [
        # Common fields
        "name",
        "phone",
        "bio",
        "university",
        "avatar_url",
        "role",
        # Student fields
        "student_id",
        "faculty",
        "year",
        # Mentor fields
        "department",
        "subject",
        "experience",
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


@bp.route("/students", methods=["GET"])
@jwt_required()
def get_students_list():
    claims = get_jwt()
    role   = claims.get("role")
    
    if role not in ["mentor", "student", "admin"]:
        return error_response("FORBIDDEN", "Access denied", status=403)
        
    students = User.query.filter_by(role="student", status="active").order_by(User.name.asc()).all()
    student_list = [{"id": s.id, "name": s.name} for s in students]
    
    return success_response(data=student_list)


@bp.route("/account", methods=["DELETE"])
@jwt_required()
def delete_account():
    from app.extensions import bcrypt
    from sqlalchemy import text

    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    data     = request.get_json(silent=True) or {}
    password = data.get("password")

    # Verify password if user has a password hash set
    if user.password_hash and password:
        if not bcrypt.check_password_hash(user.password_hash, password):
            return error_response("INVALID_PASSWORD", "Incorrect password", status=400)

    try:
        # Cascade clean up user data across tables
        db.session.execute(text("DELETE FROM mentor_profiles WHERE user_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM peer_helper_profiles WHERE user_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM user_skills WHERE user_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM notifications WHERE user_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM public_replies WHERE author_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM public_requests WHERE requester_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM direct_messages WHERE sender_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM direct_requests WHERE sender_id = :uid OR recipient_id = :uid"), {"uid": user_id})
        db.session.execute(text("DELETE FROM help_requests WHERE student_id = :uid OR assigned_to = :uid"), {"uid": user_id})

        db.session.delete(user)
        db.session.commit()

        return success_response(message="Account deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response("DELETE_ACCOUNT_ERROR", str(e), status=500)