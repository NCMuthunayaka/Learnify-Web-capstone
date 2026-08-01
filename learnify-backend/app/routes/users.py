from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.utils.response_utils import success_response, error_response

bp = Blueprint("users", __name__)


def ensure_user_education_columns():
    from sqlalchemy import text
    cols = [
        ("education_level", "VARCHAR(50) DEFAULT 'university'"),
        ("school_name", "VARCHAR(200) NULL"),
        ("grade_level", "VARCHAR(50) NULL"),
        ("stream_focus", "VARCHAR(100) NULL"),
    ]
    for col_name, col_type in cols:
        try:
            db.session.execute(text(f"SELECT {col_name} FROM users LIMIT 1"))
        except Exception:
            db.session.rollback()
            try:
                db.session.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error adding {col_name} column: {e}")


@bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    ensure_user_education_columns()
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())


@bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    ensure_user_education_columns()
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    data = request.get_json()

    # ── All updatable fields for both roles ───────────────
    allowed_fields = [
        # Common & Education level fields
        "name",
        "phone",
        "bio",
        "avatar_url",
        "role",
        "education_level",
        "school_name",
        "grade_level",
        "stream_focus",
        "university",
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


def calculate_user_eligibility(user_id):
    from sqlalchemy import text
    try:
        pub_cnt = db.session.execute(
            text("SELECT COUNT(*) FROM public_replies WHERE author_id = :uid"),
            {"uid": user_id}
        ).scalar() or 0
    except Exception:
        pub_cnt = 0

    try:
        dir_cnt = db.session.execute(
            text("SELECT COUNT(*) FROM direct_messages WHERE sender_id = :uid"),
            {"uid": user_id}
        ).scalar() or 0
    except Exception:
        dir_cnt = 0

    try:
        help_resp_count = db.session.execute(
            text("SELECT COUNT(*) FROM help_requests WHERE student_id = :uid OR assigned_to = :uid"),
            {"uid": user_id}
        ).scalar() or 0
    except Exception:
        help_resp_count = 0

    assistance_count = pub_cnt + dir_cnt + help_resp_count

    try:
        total_points = db.session.execute(
            text("SELECT total_points FROM student_profiles WHERE user_id = :uid"),
            {"uid": user_id}
        ).scalar() or 0
    except Exception:
        total_points = 0

    REQUIRED_ASSISTANCE = 3
    REQUIRED_POINTS = 30
    is_eligible = (assistance_count >= REQUIRED_ASSISTANCE or total_points >= REQUIRED_POINTS)

    return is_eligible, assistance_count, REQUIRED_ASSISTANCE, total_points, REQUIRED_POINTS


# ── GET /api/users/mentor-eligibility ─────────────────────
# Returns eligibility status and application state for student applying to be mentor
@bp.route("/mentor-eligibility", methods=["GET"])
@jwt_required()
def get_mentor_eligibility():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    from sqlalchemy import text
    from app.services.auth_service import ensure_mentor_applications_table
    ensure_mentor_applications_table()

    is_eligible, assistance_count, REQUIRED_ASSISTANCE, total_points, REQUIRED_POINTS = calculate_user_eligibility(user_id)

    # Fetch application state
    application_data = None
    try:
        row = db.session.execute(
            text("SELECT id, qualifications, certifications, status, created_at FROM mentor_applications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 1"),
            {"uid": user_id}
        ).fetchone()

        if row:
            application_data = {
                "id": row[0],
                "qualifications": row[1],
                "certifications": row[2],
                "status": row[3],
                "created_at": row[4].isoformat() if row[4] else None
            }
    except Exception as e:
        print("Error fetching mentor_applications:", e)

    return success_response(data={
        "user_role": user.role,
        "is_eligible": is_eligible,
        "current_assistance_count": assistance_count,
        "required_assistance_count": REQUIRED_ASSISTANCE,
        "current_points": total_points,
        "required_points": REQUIRED_POINTS,
        "application": application_data
    })


# ── POST /api/users/apply-mentor ──────────────────────────
# Allows qualified student to submit mentor application to admin
@bp.route("/apply-mentor", methods=["POST"])
@jwt_required()
def apply_mentor():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    if user.role == "mentor":
        return error_response("ALREADY_MENTOR", "You are already a registered Mentor", status=400)

    from sqlalchemy import text
    from app.services.auth_service import ensure_mentor_applications_table
    ensure_mentor_applications_table()

    # Re-verify eligibility using shared calculation
    is_eligible, assistance_count, REQUIRED_ASSISTANCE, total_points, REQUIRED_POINTS = calculate_user_eligibility(user_id)
    if not is_eligible:
        return error_response(
            "NOT_ELIGIBLE",
            "You are not eligible to apply as a mentor right now. Please assist more peers in the community (at least 3 peer responses or 30 activity points) and try again later.",
            status=400
        )

    # Check for existing pending application
    existing_pending = db.session.execute(
        text("SELECT id FROM mentor_applications WHERE user_id = :uid AND status = 'pending'"),
        {"uid": user_id}
    ).fetchone()

    if existing_pending:
        return error_response("PENDING_EXISTS", "Your mentor application is already under review by Admin.", status=400)

    data = request.get_json(silent=True) or {}
    qualifications = (data.get("qualifications") or "").strip()
    certifications = (data.get("certifications") or "").strip()

    if not qualifications or not certifications:
        return error_response("MISSING_FIELD", "Educational qualifications and certifications are required", status=400)

    try:
        # Check if previous application exists to update or insert new
        existing_app = db.session.execute(
            text("SELECT id FROM mentor_applications WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()

        if existing_app:
            db.session.execute(
                text(
                    "UPDATE mentor_applications "
                    "SET qualifications = :qual, certifications = :cert, status = 'pending', created_at = CURRENT_TIMESTAMP "
                    "WHERE user_id = :uid"
                ),
                {"qual": qualifications, "cert": certifications, "uid": user_id}
            )
        else:
            db.session.execute(
                text(
                    "INSERT INTO mentor_applications (user_id, qualifications, certifications, status) "
                    "VALUES (:uid, :qual, :cert, 'pending')"
                ),
                {"uid": user_id, "qual": qualifications, "cert": certifications}
            )
        db.session.commit()

        # Send notification to student
        try:
            from app.services.notification_service import create_notification
            create_notification(
                user_id=user_id,
                type_name="system",
                title="Mentor Application Submitted",
                body="Your application to become a Mentor has been submitted to Admin and is under review.",
                action_url="/notifications"
            )
        except Exception:
            pass

        return success_response(message="Mentor application submitted successfully to Admin!", status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("APPLICATION_ERROR", str(e), status=500)