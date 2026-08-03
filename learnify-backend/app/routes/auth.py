from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_mail import Message
from app.services.auth_service import register_user, login_user, google_auth_user
from app.services.email_service import send_reset_password_email
from app.utils.response_utils import success_response, error_response
from app.models.user import User
from app.extensions import db, mail, bcrypt
from datetime import datetime
import secrets
import os


bp = Blueprint("auth", __name__)


import uuid
from werkzeug.utils import secure_filename

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}

def allowed_cv_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS

# ── Upload CV / Resume ─────────────────────────────────────
@bp.route("/upload-cv", methods=["POST"])
def upload_cv():
    if "cv" not in request.files and "file" not in request.files:
        return error_response("MISSING_FILE", "CV file is required", status=400)

    file = request.files.get("cv") or request.files.get("file")
    if not file or file.filename == "":
        return error_response("MISSING_FILE", "No CV file selected", status=400)

    if not allowed_cv_file(file.filename):
        return error_response("INVALID_FILE", "Allowed CV formats: PDF, DOC, DOCX, PNG, JPG, JPEG", status=400)

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"cv_{uuid.uuid4().hex[:12]}.{ext}"

    upload_folder = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "uploads",
        "cvs"
    )
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    cv_url = f"/uploads/cvs/{filename}"
    return success_response(data={"cv_url": cv_url}, message="CV uploaded successfully")


# ── Register ──────────────────────────────────────────────
@bp.route("/register", methods=["POST"])
def register():
    data     = request.get_json() or {}
    required = ["name", "email", "password", "role"]

    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    if data["role"] not in ["student", "mentor"]:
        return error_response("INVALID_ROLE", "Role must be student or mentor", "role", 400)

    user, err = register_user(
        name           = data["name"],
        email          = data["email"],
        password       = data["password"],
        role           = data["role"],
        qualifications = data.get("qualifications"),
        certifications = data.get("certifications"),
        cv_url         = data.get("cv_url"),
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
    action       = data.get("action")

    if not google_token:
        return error_response("MISSING_FIELD", "Google token is required", status=400)

    user, is_new_user, err = google_auth_user(google_token, action)

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
            "is_new_user":   is_new_user,
        },
        message="Google login successful",
    )


# ── Get Current User ──────────────────────────────────────
@bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    return success_response(data=user.to_dict())


# ── Refresh Token ─────────────────────────────────────────
@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    # ✅ Always pull latest role from DB so JWT stays up to date
    access_token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "role":  user.role  or "",
            "name":  user.name  or "",
            "email": user.email or "",
        }
    )
    return success_response(data={"access_token": access_token})


# ── Logout ────────────────────────────────────────────────
@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    from app.models.token_blocklist import TokenBlocklist
    from flask_jwt_extended import decode_token

    user_id    = int(get_jwt_identity())
    access_jti = get_jwt()["jti"]

    db.session.add(TokenBlocklist(
        jti        = access_jti,
        token_type = "access",
        user_id    = user_id,
        revoked_at = datetime.utcnow(),
    ))

    refresh_token = request.headers.get("X-Refresh-Token")
    if refresh_token:
        try:
            decoded_refresh = decode_token(refresh_token)
            db.session.add(TokenBlocklist(
                jti        = decoded_refresh["jti"],
                token_type = "refresh",
                user_id    = user_id,
                revoked_at = datetime.utcnow(),
            ))
        except Exception:
            pass

    db.session.commit()
    return success_response(message="Logged out successfully")


# ── Forgot Password ───────────────────────────────────────
@bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return error_response("MISSING_EMAIL", "Email is required", status=400)

    user = User.query.filter(db.func.lower(User.email) == email).first()

    # Return error if user is not registered in database so user knows why email wasn't sent
    if not user:
        print(f"⚠️ Forgot password requested for '{email}', but NO USER was found in the database.")
        return error_response(
            "USER_NOT_FOUND",
            f"No registered account found with email '{email}'. Please check your email address or register first.",
            status=400
        )

    try:
        from datetime import timedelta
        from app.models.password_reset import PasswordReset

        # Invalidate existing tokens
        PasswordReset.query.filter_by(
            user_id=user.id, used=False
        ).update({"used": True})
        db.session.commit()

        # Generate secure token
        token      = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)

        reset = PasswordReset(
            user_id    = user.id,
            token      = token,
            expires_at = expires_at,
        )
        db.session.add(reset)
        db.session.commit()

        # Build reset URL cleanly handling comma-separated FRONTEND_URL values
        raw_frontend_url = os.environ.get("FRONTEND_URL", "https://learnify-web-capstone-git-main-muthunayaka.vercel.app")
        urls = [u.strip().rstrip("/") for u in raw_frontend_url.split(",") if u.strip()]
        frontend_url = next((u for u in urls if "vercel.app" in u or "railway.app" in u or "whisperhive" in u), urls[0] if urls else "https://learnify-web-capstone-git-main-muthunayaka.vercel.app")
        reset_url = f"{frontend_url}/reset-password?token={token}"


        # Send email via HTTP API (Resend) or SMTP fallback
        send_reset_password_email(user.email, user.name, reset_url)

    except Exception as e:
        import traceback
        print(f"❌ Password reset email failed to send: {e}")
        traceback.print_exc()

    return success_response(
        message="If that email exists, a reset link has been sent"
    )


# ── Test Email Endpoint ───────────────────────────────────
@bp.route("/test-email", methods=["GET", "POST"])
def test_email():
    target = request.args.get("to")
    if not target and request.is_json:
        target = request.json.get("to")

    username = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")
    sender   = current_app.config.get("MAIL_DEFAULT_SENDER") or username
    server   = current_app.config.get("MAIL_SERVER")
    port     = current_app.config.get("MAIL_PORT")

    resend_key = os.environ.get("RESEND_API_KEY")
    recipient = target or username or "test@example.com"
    db_user = User.query.filter(db.func.lower(User.email) == recipient.lower()).first()

    diag = {
        "RESEND_API_KEY_SET": bool(resend_key),
        "MAIL_SERVER": server,
        "MAIL_PORT": port,
        "MAIL_USERNAME_SET": bool(username),
        "MAIL_USERNAME": username if username else None,
        "MAIL_PASSWORD_SET": bool(password),
        "MAIL_PASSWORD_LEN": len(password) if password else 0,
        "MAIL_DEFAULT_SENDER": sender,
        "RECIPIENT": recipient,
        "RECIPIENT_EXISTS_IN_DB": bool(db_user),
        "RECIPIENT_DB_EMAIL": db_user.email if db_user else None,
    }

    try:
        send_reset_password_email(recipient, "Test User", "https://example.com/test-reset")
        return success_response(
            message=f"Test email successfully sent to {recipient}!",
            data=diag
        )
    except Exception as e:
        import traceback
        err_msg = str(e)
        tb = traceback.format_exc()
        print(f"❌ Test Email Error: {err_msg}\n{tb}")
        return error_response(
            "MAIL_SEND_FAILED",
            f"Failed to send email: {err_msg}",
            details={"config": diag, "error": err_msg},
            status=200
        )


# ── Reset Password ────────────────────────────────────────
@bp.route("/reset-password", methods=["POST"])
def reset_password():
    data     = request.get_json()
    token    = data.get("token",    "").strip()
    password = data.get("password", "").strip()

    if not token or not password:
        return error_response(
            "MISSING_FIELDS", "Token and password are required", status=400
        )

    if len(password) < 8:
        return error_response(
            "WEAK_PASSWORD", "Password must be at least 8 characters", status=400
        )

    try:
        from app.models.password_reset import PasswordReset

        reset = PasswordReset.query.filter_by(token=token).first()

        if not reset or not reset.is_valid():
            return error_response(
                "INVALID_TOKEN",
                "This reset link is invalid or has expired",
                status=400
            )

        user = User.query.get(reset.user_id)
        if not user:
            return error_response("NOT_FOUND", "User not found", status=404)

        # ✅ Use bcrypt — same as register_user and login_user
        user.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        reset.used         = True
        db.session.commit()

        return success_response(message="Password reset successfully")

    except Exception as e:
        db.session.rollback()
        return error_response("RESET_FAILED", str(e), status=500)