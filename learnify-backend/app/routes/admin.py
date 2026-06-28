from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, text
from datetime import datetime, timedelta
from app.extensions import db
from app.models.user import User
from app.models.feedback import Feedback
from app.utils.response_utils import success_response, error_response

bp = Blueprint("admin", __name__)

PAGE_SIZE = 10


def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error_response("FORBIDDEN", "Admin access required", status=403)
    return None


# ── GET /api/admin/stats ──────────────────────────────────────
@bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    err = _require_admin()
    if err:
        return err

    total    = User.query.count()
    students = User.query.filter_by(role="student").count()
    mentors  = User.query.filter_by(role="mentor").count()
    admins   = User.query.filter_by(role="admin").count()
    pending  = User.query.filter_by(status="pending").count()
    active   = User.query.filter_by(status="active").count()

    return success_response(data={
        "total_users":       total,
        "students":          students,
        "mentors":           mentors,
        "admins":            admins,
        "pending_approvals": pending,
        "active_users":      active,
    })


# ── GET /api/admin/users ──────────────────────────────────────
@bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    err = _require_admin()
    if err:
        return err

    page   = max(1, int(request.args.get("page",   1)))
    role   = request.args.get("role",   None)
    status = request.args.get("status", None)
    search = request.args.get("search", None)

    query = User.query

    if role   and role   != "all":
        query = query.filter(func.lower(User.role)   == role.lower())
    if status and status != "all":
        query = query.filter(func.lower(User.status) == status.lower())
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(User.name.ilike(like), User.email.ilike(like))
        )

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
             .offset((page - 1) * PAGE_SIZE)
             .limit(PAGE_SIZE)
             .all()
    )

    return success_response(data={
        "users":       [u.to_dict() for u in users],
        "total":       total,
        "page":        page,
        "page_size":   PAGE_SIZE,
        "total_pages": max(1, -(-total // PAGE_SIZE)),
    })


# ── PATCH /api/admin/users/<id>/status ───────────────────────
@bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@jwt_required()
def update_user_status(user_id):
    err = _require_admin()
    if err:
        return err

    data   = request.get_json() or {}
    status = data.get("status")

    if not status:
        return error_response("MISSING_STATUS", "status is required", status=400)
    if status not in ("active", "pending", "inactive"):
        return error_response("INVALID_STATUS",
                              "status must be active, pending, or inactive",
                              status=400)

    user = User.query.get(user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    user.status = status
    db.session.commit()

    return success_response(data=user.to_dict(), message="Status updated")


# ── DELETE /api/admin/users/<id> ─────────────────────────────
@bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    err = _require_admin()
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    db.session.delete(user)
    db.session.commit()

    return success_response(message="User deleted")


# ── GET /api/admin/approvals/pending ─────────────────────────
@bp.route("/approvals/pending", methods=["GET"])
@jwt_required()
def get_pending_approvals():
    err = _require_admin()
    if err:
        return err

    page = max(1, int(request.args.get("page", 1)))

    query = User.query.filter_by(status="pending")
    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
             .offset((page - 1) * PAGE_SIZE)
             .limit(PAGE_SIZE)
             .all()
    )

    return success_response(data={
        "users":       [u.to_dict() for u in users],
        "total":       total,
        "page":        page,
        "page_size":   PAGE_SIZE,
        "total_pages": max(1, -(-total // PAGE_SIZE)),
    })


# ── POST /api/admin/approvals/<id>/approve ───────────────────
@bp.route("/approvals/<int:user_id>/approve", methods=["POST"])
@jwt_required()
def approve_user(user_id):
    err = _require_admin()
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    user.status = "active"
    db.session.commit()

    return success_response(data=user.to_dict(), message="User approved")


# ── POST /api/admin/approvals/<id>/reject ────────────────────
@bp.route("/approvals/<int:user_id>/reject", methods=["POST"])
@jwt_required()
def reject_user(user_id):
    err = _require_admin()
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    user.status = "inactive"
    db.session.commit()

    return success_response(data=user.to_dict(), message="User rejected")


# ── GET /api/admin/analytics ─────────────────────────────────
@bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    err = _require_admin()
    if err:
        return err

    total    = User.query.count()
    students = User.query.filter_by(role="student").count()
    mentors  = User.query.filter_by(role="mentor").count()
    pending  = User.query.filter_by(status="pending").count()

    recent_users = (
        User.query
            .order_by(User.created_at.desc())
            .limit(5)
            .all()
    )

    # Daily registrations for the last 7 days
    today = datetime.utcnow().date()
    growth_data = []
    day_names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        count = User.query.filter(
            func.date(User.created_at) == day
        ).count()
        growth_data.append({
            "day":   day_names[day.weekday()],
            "value": count,
        })

    # Mentor performance via feedback avg rating per mentor
    mentor_scores = (
        db.session.query(
            User.id, User.name,
            func.round(func.avg(Feedback.rating) * 20, 0).label("score")
        )
        .join(Feedback, Feedback.mentor_id == User.id)
        .filter(User.role == "mentor")
        .group_by(User.id, User.name)
        .order_by(func.avg(Feedback.rating).desc())
        .limit(4)
        .all()
    )

    mentor_performance = [
        {
            "name":     row.name,
            "score":    int(row.score) if row.score else 0,
            "initials": "".join(w[0] for w in row.name.split()[:2]).upper(),
        }
        for row in mentor_scores
    ]

    return success_response(data={
        "stats": {
            "total_users":       total,
            "students":          students,
            "mentors":           mentors,
            "pending_approvals": pending,
        },
        "recent_users":      [u.to_dict() for u in recent_users],
        "growth_data":       growth_data,
        "mentor_performance": mentor_performance,
    })


# ── GET /api/admin/system/health ─────────────────────────────
@bp.route("/system/health", methods=["GET"])
@jwt_required()
def system_health():
    err = _require_admin()
    if err:
        return err

    db_ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    total_users    = User.query.count() if db_ok else 0
    active_users   = User.query.filter_by(status="active").count() if db_ok else 0
    total_feedback = Feedback.query.count() if db_ok else 0

    return success_response(data={
        "database":       "healthy" if db_ok else "error",
        "api":            "healthy",
        "total_users":    total_users,
        "active_users":   active_users,
        "total_feedback": total_feedback,
        "uptime_pct":     99.9,
    })


# ── GET /api/admin/feedback ───────────────────────────────────
@bp.route("/feedback", methods=["GET"])
@jwt_required()
def get_all_feedback():
    err = _require_admin()
    if err:
        return err

    page      = max(1, int(request.args.get("page",      1)))
    category  = request.args.get("category",  None)
    sentiment = request.args.get("sentiment", None)
    search    = request.args.get("search",    None)

    query = Feedback.query

    if category and category != "All":
        query = query.filter_by(category=category)
    if sentiment and sentiment != "All":
        query = query.filter_by(sentiment=sentiment.lower())
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Feedback.comment.ilike(like),
                Feedback.subject.ilike(like),
            )
        )

    total = query.count()
    items = (
        query.order_by(Feedback.created_at.desc())
             .offset((page - 1) * PAGE_SIZE)
             .limit(PAGE_SIZE)
             .all()
    )

    result = []
    for fb in items:
        u = User.query.get(fb.user_id)
        result.append(fb.to_dict(user_name=u.name if u else None))

    return success_response(data={
        "feedback":    result,
        "total":       total,
        "page":        page,
        "page_size":   PAGE_SIZE,
        "total_pages": max(1, -(-total // PAGE_SIZE)),
    })


# ── GET /api/admin/feedback/stats ────────────────────────────
@bp.route("/feedback/stats", methods=["GET"])
@jwt_required()
def get_feedback_stats():
    err = _require_admin()
    if err:
        return err

    total      = Feedback.query.count()
    avg_rating = db.session.query(func.avg(Feedback.rating)).scalar() or 0
    positive   = Feedback.query.filter_by(sentiment="positive").count()
    neutral    = Feedback.query.filter_by(sentiment="neutral").count()
    negative   = Feedback.query.filter_by(sentiment="negative").count()

    # Weekly trend (last 6 weeks)
    today = datetime.utcnow().date()
    trend = []
    for week_offset in range(5, -1, -1):
        week_start = today - timedelta(days=today.weekday() + week_offset * 7)
        week_end   = week_start + timedelta(days=7)
        pos = Feedback.query.filter(
            Feedback.sentiment == "positive",
            func.date(Feedback.created_at) >= week_start,
            func.date(Feedback.created_at) <  week_end,
        ).count()
        neu = Feedback.query.filter(
            Feedback.sentiment == "neutral",
            func.date(Feedback.created_at) >= week_start,
            func.date(Feedback.created_at) <  week_end,
        ).count()
        neg = Feedback.query.filter(
            Feedback.sentiment == "negative",
            func.date(Feedback.created_at) >= week_start,
            func.date(Feedback.created_at) <  week_end,
        ).count()
        trend.append({
            "week":     f"W{6 - week_offset}",
            "positive": pos,
            "neutral":  neu,
            "negative": neg,
        })

    return success_response(data={
        "total":      total,
        "avg_rating": round(float(avg_rating), 2),
        "positive":   positive,
        "neutral":    neutral,
        "negative":   negative,
        "trend":      trend,
    })
