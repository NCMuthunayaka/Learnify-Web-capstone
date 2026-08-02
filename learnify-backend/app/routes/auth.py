from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_mail import Message
from app.services.auth_service import register_user, login_user, google_auth_user
from app.utils.response_utils import success_response, error_response
from app.models.user import User
from app.extensions import db, mail, bcrypt
from datetime import datetime
import secrets

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
        name           = data["name"],
        email          = data["email"],
        password       = data["password"],
        role           = data["role"],
        qualifications = data.get("qualifications"),
        certifications = data.get("certifications"),
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

    user = User.query.filter_by(email=email).first()

    # Always return success to prevent email enumeration
    if not user:
        return success_response(
            message="If that email exists, a reset link has been sent"
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

        # Build reset URL
        reset_url = f"http://localhost:3000/reset-password?token={token}"

        # Send email — mail imported at top, no circular import
        msg = Message(
            subject    = "Reset Your Learnify Password",
            recipients = [user.email],
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px;
          margin: 0 auto; padding: 24px;">
          <h2 style="color: #0A1931;">Reset Your Password</h2>
          <p style="color: #555;">Hi {user.name or 'there'},</p>
          <p style="color: #555;">
            You requested a password reset for your Learnify account.
            Click the button below to reset your password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="{reset_url}"
            style="display: inline-block; background: #1A3D63;
              color: white; padding: 12px 24px; border-radius: 8px;
              text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 11px;">
            © 2026 Learnify · Sabaragamuwa University of Sri Lanka
          </p>
        </div>
        """
        mail.send(msg)

    except Exception as e:
        print(f"Password reset error: {e}")

    return success_response(
        message="If that email exists, a reset link has been sent"
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