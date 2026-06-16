from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from sqlalchemy import text
from app.utils.response_utils import success_response, error_response

bp = Blueprint("tracking", __name__)


# ── POST /api/tracking/sessions/<id>/start ─────────────────────────────────
@bp.route("/sessions/<int:session_id>/start", methods=["POST"])
@jwt_required()
def start_session(session_id):
    user_id = int(get_jwt_identity())
    
    try:
        row = db.session.execute(
            text("SELECT id, student_id, completed, duration_min FROM study_sessions WHERE id = :sid"),
            {"sid": session_id}
        ).fetchone()
        
        if not row or row[1] != user_id:
            return error_response("NOT_FOUND", "Study session not found", status=404)
            
        return success_response(
            data={
                "id": row[0],
                "completed": bool(row[2]),
                "duration_min": row[3]
            },
            message="Study session started"
        )
    except Exception as e:
        return error_response("START_FAILED", str(e), status=500)


# ── POST /api/tracking/sessions/<id>/end ───────────────────────────────────
@bp.route("/sessions/<int:session_id>/end", methods=["POST"])
@jwt_required()
def end_session(session_id):
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    status = data.get("status", "Completed")
    hours = data.get("hours")
    
    if status not in ("Completed", "Partially Completed", "Skipped"):
        return error_response("INVALID_STATUS", "Invalid status value", status=400)
        
    try:
        session_row = db.session.execute(
            text("SELECT id, student_id, subject_id, start_time, duration_min, completed FROM study_sessions WHERE id = :sid"),
            {"sid": session_id}
        ).fetchone()
        
        if not session_row or session_row[1] != user_id:
            return error_response("NOT_FOUND", "Study session not found", status=404)
            
        scheduled_duration_min = session_row[4]
        
        if status == "Completed":
            actual_duration_min = int(hours * 60) if hours is not None else scheduled_duration_min
            completed_val = 1
        elif status == "Partially Completed":
            actual_duration_min = int(hours * 60) if hours is not None else scheduled_duration_min
            completed_val = 1
        else: # Skipped
            actual_duration_min = 0
            completed_val = 0
            
        # Compute focus rating
        focus_rating = 0.0
        if scheduled_duration_min > 0:
            focus_rating = min(100.0, (actual_duration_min / scheduled_duration_min) * 100.0)
            
        # Update study session record
        db.session.execute(
            text("UPDATE study_sessions SET completed = :completed, duration_min = :duration_min WHERE id = :sid"),
            {"completed": completed_val, "duration_min": actual_duration_min, "sid": session_id}
        )
        db.session.commit()
        
        # Update daily progress snapshot study hours and completion
        session_date = session_row[3].date()
        subject_id = session_row[2]
        
        from app.services.analytics_service import update_daily_progress_snapshot, check_and_award_achievements
        update_daily_progress_snapshot(user_id, subject_id, session_date)
        
        # Check and award achievements
        achievements_earned = check_and_award_achievements(user_id)
        
        return success_response(
            data={
                "id": session_id,
                "completed": bool(completed_val),
                "duration_min": actual_duration_min,
                "focus_rating": round(focus_rating, 1),
                "achievements_earned": achievements_earned
            },
            message="Study session updated successfully"
        )
    except Exception as e:
        db.session.rollback()
        return error_response("END_FAILED", str(e), status=500)


# ── GET /api/tracking/metrics ──────────────────────────────────────────────
@bp.route("/metrics", methods=["GET"])
@jwt_required()
def get_metrics():
    user_id = int(get_jwt_identity())
    days = request.args.get("days", default=7, type=int)

    from app.services.tracking_engine import get_productivity_metrics
    metrics = get_productivity_metrics(user_id, days)

    if not metrics:
        return error_response("METRICS_FAILED", "Failed to calculate metrics", status=500)

    return success_response(data=metrics)
