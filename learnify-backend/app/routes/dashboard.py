from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.utils.response_utils import success_response, error_response
from app.services.analytics_service import get_analytics_bundle

bp = Blueprint("dashboard", __name__)


# ── GET /api/dashboard/stats ──────────────────────────────
# Returns all stats needed for dashboard page
@bp.route("/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found", status=404)

    # ── Get subjects count ────────────────────────────────
    # Count subjects enrolled by this student
    from app.models.subject import Subject
    try:
        from sqlalchemy import text
        subjects_count = db.session.execute(
            text("SELECT COUNT(*) FROM student_subjects ss "
                 "JOIN student_profiles sp ON ss.student_id = sp.id "
                 "WHERE sp.user_id = :user_id"),
            {"user_id": user_id}
        ).scalar() or 0
    except Exception:
        subjects_count = 0

    # ── Get today's tasks count ───────────────────────────
    from datetime import date
    try:
        from sqlalchemy import text
        tasks_today = db.session.execute(
            text("SELECT COUNT(*) FROM tasks "
                 "WHERE student_id = :user_id "
                 "AND due_date = :today"),
            {"user_id": user_id, "today": date.today()}
        ).scalar() or 0
    except Exception:
        tasks_today = 0

    # ── Get completed tasks count ─────────────────────────
    try:
        from sqlalchemy import text
        completed = db.session.execute(
            text("SELECT COUNT(*) FROM tasks "
                 "WHERE student_id = :user_id "
                 "AND status = 'done'"),
            {"user_id": user_id}
        ).scalar() or 0
    except Exception:
        completed = 0

    # ── Get weekly study hours ────────────────────────────
    # Get study sessions for last 7 days grouped by day
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import text
        week_ago = datetime.now() - timedelta(days=7)
        weekly_data = db.session.execute(
            text("SELECT DAYNAME(start_time) as day, "
                 "SUM(duration_min)/60 as hours "
                 "FROM study_sessions "
                 "WHERE student_id = :user_id "
                 "AND start_time >= :week_ago "
                 "AND completed = 1 "
                 "GROUP BY DAYNAME(start_time), DAYOFWEEK(start_time) "
                 "ORDER BY DAYOFWEEK(start_time)"),
            {"user_id": user_id, "week_ago": week_ago}
        ).fetchall()

        # Format for chart
        days_map = {
            "Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed",
            "Thursday": "Thu", "Friday": "Fri", "Saturday": "Sat",
            "Sunday": "Sun"
        }
        weekly_chart = [
            {"day": days_map.get(row[0], row[0]), "value": round(float(row[1]), 1)}
            for row in weekly_data
        ]

        # Fill missing days with 0
        all_days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
        existing = {d["day"] for d in weekly_chart}
        for day in all_days:
            if day not in existing:
                weekly_chart.append({"day": day, "value": 0})

        # Sort by day order
        day_order = {d: i for i, d in enumerate(all_days)}
        weekly_chart.sort(key=lambda x: day_order.get(x["day"], 0))

    except Exception:
        weekly_chart = [
            {"day": "Mon", "value": 0},
            {"day": "Tue", "value": 0},
            {"day": "Wed", "value": 0},
            {"day": "Thu", "value": 0},
            {"day": "Fri", "value": 0},
            {"day": "Sat", "value": 0},
            {"day": "Sun", "value": 0},
        ]

    # ── Get upcoming deadlines ────────────────────────────
    try:
        from datetime import date as date_type
        from sqlalchemy import text
        upcoming = db.session.execute(
            text("SELECT t.title, t.due_date, s.name as subject_name, "
                 "s.color_hex "
                 "FROM tasks t "
                 "JOIN subjects s ON t.subject_id = s.id "
                 "WHERE t.student_id = :user_id "
                 "AND t.due_date >= :today "
                 "AND t.status != 'done' "
                 "ORDER BY t.due_date ASC "
                 "LIMIT 10"),
            {"user_id": user_id, "today": date_type.today()}
        ).fetchall()

        deadlines = [
            {
                "title":        row[0],
                "due_date":     str(row[1]),
                "subject_name": row[2],
                "color_hex":    row[3],
            }
            for row in upcoming
        ]
    except Exception:
        deadlines = []

    # ── Get scheduled subjects ────────────────────────────
    try:
        from sqlalchemy import text
        scheduled = db.session.execute(
            text("SELECT s.name, s.color_hex "
                 "FROM student_subjects ss "
                 "JOIN student_profiles sp ON ss.student_id = sp.id "
                 "JOIN subjects s ON ss.subject_id = s.id "
                 "WHERE sp.user_id = :user_id "
                 "LIMIT 5"),
            {"user_id": user_id}
        ).fetchall()

        scheduled_subjects = [
            {"name": row[0], "color_hex": row[1]}
            for row in scheduled
        ]
    except Exception:
        scheduled_subjects = []

    # ── Analytics bundle (streak, focus score, goal %) ───
    analytics = get_analytics_bundle(user_id)

    return success_response(data={
        "stats": {
            "subjects":    int(subjects_count),
            "tasks_today": int(tasks_today),
            "completed":   int(completed),
        },
        "analytics":          analytics,
        "weekly_chart":       weekly_chart,
        "deadlines":          deadlines,
        "scheduled_subjects": scheduled_subjects,
    })