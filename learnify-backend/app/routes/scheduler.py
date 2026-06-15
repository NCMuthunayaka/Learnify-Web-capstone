from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from app.extensions import db
from app.utils.response_utils import success_response, error_response

bp = Blueprint("scheduler", __name__)


# ── Helper: resolve student_id from user_id ───────────────
def _get_student_profile_id(user_id: int):
    """Returns student_profiles.id for the given user, or None."""
    row = db.session.execute(
        text("SELECT id FROM student_profiles WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()
    return int(row[0]) if row else None


# ═══════════════════════════════════════════════════════════
# TIMETABLE
# ═══════════════════════════════════════════════════════════

# ── GET /api/scheduler/timetable ─────────────────────────
# Returns study sessions for the current week (Mon-Sun)
@bp.route("/timetable", methods=["GET"])
@jwt_required()
def get_timetable():
    user_id = int(get_jwt_identity())

    try:
        from datetime import date, timedelta
        today     = date.today()
        # Get Monday of current week
        week_start = today - timedelta(days=today.weekday())
        week_end   = week_start + timedelta(days=6)

        rows = db.session.execute(
            text(
                "SELECT ss.id, ss.subject_id, s.name AS subject_name, "
                "s.color_hex, ss.start_time, ss.end_time, "
                "ss.duration_min, ss.session_type, ss.completed "
                "FROM study_sessions ss "
                "JOIN subjects s ON ss.subject_id = s.id "
                "WHERE ss.student_id = :uid "
                "AND DATE(ss.start_time) BETWEEN :wstart AND :wend "
                "ORDER BY ss.start_time ASC"
            ),
            {"uid": user_id, "wstart": week_start, "wend": week_end}
        ).fetchall()

        sessions = [
            {
                "id":           row[0],
                "subject_id":   row[1],
                "subject_name": row[2],
                "color_hex":    row[3],
                "start_time":   row[4].isoformat() if row[4] else None,
                "end_time":     row[5].isoformat() if row[5] else None,
                "duration_min": row[6],
                "session_type": row[7],
                "completed":    bool(row[8]),
            }
            for row in rows
        ]

        return success_response(data={
            "week_start": str(week_start),
            "week_end":   str(week_end),
            "sessions":   sessions,
        })
    except Exception as e:
        return error_response("TIMETABLE_ERROR", str(e), status=500)


# ═══════════════════════════════════════════════════════════
# TASKS — CRUD
# ═══════════════════════════════════════════════════════════

# ── GET /api/scheduler/tasks ──────────────────────────────
# Returns all tasks for the student (optionally filtered by status)
@bp.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    status  = request.args.get("status")   # optional filter: todo|in_progress|done

    try:
        query = (
            "SELECT t.id, t.title, t.type, t.due_date, t.status, "
            "t.completion_pct, t.created_at, "
            "s.id AS subject_id, s.name AS subject_name, s.color_hex "
            "FROM tasks t "
            "JOIN subjects s ON t.subject_id = s.id "
            "WHERE t.student_id = :uid"
        )
        params = {"uid": user_id}

        if status:
            query += " AND t.status = :status"
            params["status"] = status

        query += " ORDER BY t.due_date ASC"

        rows = db.session.execute(text(query), params).fetchall()

        tasks = [
            {
                "id":             row[0],
                "title":          row[1],
                "type":           row[2],
                "due_date":       str(row[3]),
                "status":         row[4],
                "completion_pct": row[5],
                "created_at":     row[6].isoformat() if row[6] else None,
                "subject_id":     row[7],
                "subject_name":   row[8],
                "color_hex":      row[9],
            }
            for row in rows
        ]

        return success_response(data={"tasks": tasks})
    except Exception as e:
        return error_response("TASKS_ERROR", str(e), status=500)


# ── POST /api/scheduler/tasks ─────────────────────────────
# Create a new task
@bp.route("/tasks", methods=["POST"])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}

    required = ["title", "subject_id", "due_date"]
    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    # Validations
    title = data["title"].strip()
    if not title:
        return error_response("INVALID_TITLE", "title cannot be empty or spaces", status=400)

    due_date = data["due_date"]
    try:
        from datetime import datetime
        datetime.strptime(due_date, "%Y-%m-%d")
    except (ValueError, TypeError):
        return error_response("INVALID_DATE", "Date must be in YYYY-MM-DD format", status=400)

    try:
        subject_id = int(data["subject_id"])
    except (ValueError, TypeError):
        return error_response("INVALID_SUBJECT", "subject_id must be an integer", status=400)

    # Check if subject exists
    sub_exists = db.session.execute(
        text("SELECT id FROM subjects WHERE id = :sid"),
        {"sid": subject_id}
    ).fetchone()
    if not sub_exists:
        return error_response("SUBJECT_NOT_FOUND", "Subject not found", status=400)

    task_type = data.get("type", "assignment")
    if task_type not in ('assignment', 'exam', 'project', 'lab_report'):
        return error_response("INVALID_TYPE", "type must be assignment, exam, project, or lab_report", status=400)

    try:
        db.session.execute(
            text(
                "INSERT INTO tasks (student_id, subject_id, title, type, "
                "due_date, status, completion_pct) "
                "VALUES (:student_id, :subject_id, :title, :type, "
                ":due_date, 'todo', 0)"
            ),
            {
                "student_id": user_id,
                "subject_id": subject_id,
                "title":      title,
                "type":       task_type,
                "due_date":   due_date,
            }
        )
        db.session.commit()

        # Fetch the newly created task
        new_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        row = db.session.execute(
            text(
                "SELECT t.id, t.title, t.type, t.due_date, t.status, "
                "t.completion_pct, t.created_at, "
                "s.id, s.name, s.color_hex "
                "FROM tasks t JOIN subjects s ON t.subject_id = s.id "
                "WHERE t.id = :id"
            ),
            {"id": new_id}
        ).fetchone()

        return success_response(
            data={
                "task": {
                    "id":             row[0],
                    "title":          row[1],
                    "type":           row[2],
                    "due_date":       str(row[3]),
                    "status":         row[4],
                    "completion_pct": row[5],
                    "created_at":     row[6].isoformat(),
                    "subject_id":     row[7],
                    "subject_name":   row[8],
                    "color_hex":      row[9],
                }
            },
            message="Task created",
            status=201,
        )
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_FAILED", str(e), status=500)


# ── PUT /api/scheduler/tasks/<id> ────────────────────────
# Update a task's title, due_date, type, completion_pct
@bp.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}

    try:
        # Verify ownership
        row = db.session.execute(
            text("SELECT id FROM tasks WHERE id = :tid AND student_id = :uid"),
            {"tid": task_id, "uid": user_id}
        ).fetchone()
        if not row:
            return error_response("NOT_FOUND", "Task not found", status=404)

        # Build updates dict from allowed fields
        updates = {}

        if "title" in data:
            title = data["title"]
            if not title or not str(title).strip():
                return error_response("INVALID_TITLE", "title cannot be empty", status=400)
            updates["title"] = str(title).strip()

        if "type" in data:
            task_type = data["type"]
            if task_type not in ('assignment', 'exam', 'project', 'lab_report'):
                return error_response("INVALID_TYPE", "type must be assignment, exam, project, or lab_report", status=400)
            updates["type"] = task_type

        if "due_date" in data:
            due_date = data["due_date"]
            try:
                from datetime import datetime
                datetime.strptime(due_date, "%Y-%m-%d")
            except (ValueError, TypeError):
                return error_response("INVALID_DATE", "Date must be in YYYY-MM-DD format", status=400)
            updates["due_date"] = due_date

        if "subject_id" in data:
            try:
                subject_id = int(data["subject_id"])
            except (ValueError, TypeError):
                return error_response("INVALID_SUBJECT", "subject_id must be an integer", status=400)

            sub_exists = db.session.execute(
                text("SELECT id FROM subjects WHERE id = :sid"),
                {"sid": subject_id}
            ).fetchone()
            if not sub_exists:
                return error_response("SUBJECT_NOT_FOUND", "Subject not found", status=400)
            updates["subject_id"] = subject_id

        # Sync/Validation for status & completion_pct
        new_status = data.get("status")
        new_pct = data.get("completion_pct")

        if new_status is not None:
            if new_status not in ("todo", "in_progress", "done"):
                return error_response("INVALID_STATUS", "status must be todo, in_progress, or done", status=400)

        if new_pct is not None:
            try:
                pct_val = int(new_pct)
                if not (0 <= pct_val <= 100):
                    raise ValueError()
            except (ValueError, TypeError):
                return error_response("INVALID_COMPLETION", "completion_pct must be an integer between 0 and 100", status=400)

        # Sync logic
        if new_status is not None and new_pct is None:
            if new_status == "done":
                new_pct = 100
            elif new_status == "in_progress":
                new_pct = 50
            else:
                new_pct = 0
        elif new_pct is not None and new_status is None:
            pct_val = int(new_pct)
            if pct_val == 100:
                new_status = "done"
            elif pct_val == 0:
                new_status = "todo"
            else:
                new_status = "in_progress"
        elif new_pct is not None and new_status is not None:
            pct_val = int(new_pct)
            if pct_val == 100 and new_status != "done":
                new_status = "done"
            elif pct_val == 0 and new_status != "todo":
                new_status = "todo"
            elif 0 < pct_val < 100 and new_status not in ("in_progress", "done"):
                new_status = "in_progress"

        if new_status is not None:
            updates["status"] = new_status
        if new_pct is not None:
            updates["completion_pct"] = int(new_pct)

        if not updates:
            return error_response("NO_FIELDS", "No valid fields to update", status=400)

        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["tid"] = task_id

        db.session.execute(
            text(f"UPDATE tasks SET {set_clause} WHERE id = :tid"),
            updates
        )
        db.session.commit()
        return success_response(message="Task updated")
    except Exception as e:
        db.session.rollback()
        return error_response("UPDATE_FAILED", str(e), status=500)


# ── PATCH /api/scheduler/tasks/<id>/status ───────────────
# Quick status change: todo → in_progress → done
@bp.route("/tasks/<int:task_id>/status", methods=["PATCH"])
@jwt_required()
def update_task_status(task_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}
    status  = data.get("status")

    if status not in ("todo", "in_progress", "done"):
        return error_response("INVALID_STATUS", "status must be todo, in_progress, or done", status=400)

    try:
        row = db.session.execute(
            text("SELECT id FROM tasks WHERE id = :tid AND student_id = :uid"),
            {"tid": task_id, "uid": user_id}
        ).fetchone()
        if not row:
            return error_response("NOT_FOUND", "Task not found", status=404)

        # Auto-set completion_pct
        pct = 100 if status == "done" else (50 if status == "in_progress" else 0)

        db.session.execute(
            text("UPDATE tasks SET status = :status, completion_pct = :pct WHERE id = :tid"),
            {"status": status, "pct": pct, "tid": task_id}
        )
        db.session.commit()
        return success_response(message="Task status updated")
    except Exception as e:
        db.session.rollback()
        return error_response("STATUS_FAILED", str(e), status=500)


# ── DELETE /api/scheduler/tasks/<id> ─────────────────────
# Permanently delete a task
@bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())

    try:
        row = db.session.execute(
            text("SELECT id FROM tasks WHERE id = :tid AND student_id = :uid"),
            {"tid": task_id, "uid": user_id}
        ).fetchone()
        if not row:
            return error_response("NOT_FOUND", "Task not found", status=404)

        db.session.execute(
            text("DELETE FROM tasks WHERE id = :tid"),
            {"tid": task_id}
        )
        db.session.commit()
        return success_response(message="Task deleted")
    except Exception as e:
        db.session.rollback()
        return error_response("DELETE_FAILED", str(e), status=500)


# ═══════════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════════

# ── GET /api/scheduler/stats ─────────────────────────────
# Returns weekly hours, completed sessions, upcoming deadlines count, focus score
@bp.route("/stats", methods=["GET"])
@jwt_required()
def get_scheduler_stats():
    user_id = int(get_jwt_identity())

    try:
        from datetime import date, timedelta, datetime

        today      = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end   = week_start + timedelta(days=6)

        # Weekly study hours
        hours_row = db.session.execute(
            text(
                "SELECT COALESCE(SUM(duration_min), 0) "
                "FROM study_sessions "
                "WHERE student_id = :uid AND completed = 1 "
                "AND DATE(start_time) BETWEEN :ws AND :we"
            ),
            {"uid": user_id, "ws": week_start, "we": week_end}
        ).fetchone()
        weekly_hours = round(float(hours_row[0]) / 60, 1)

        # Sessions completed this week
        sessions_row = db.session.execute(
            text(
                "SELECT COUNT(*) FROM study_sessions "
                "WHERE student_id = :uid AND completed = 1 "
                "AND DATE(start_time) BETWEEN :ws AND :we"
            ),
            {"uid": user_id, "ws": week_start, "we": week_end}
        ).fetchone()
        sessions_completed = int(sessions_row[0])

        # Total sessions this week (for completion rate)
        total_sessions_row = db.session.execute(
            text(
                "SELECT COUNT(*) FROM study_sessions "
                "WHERE student_id = :uid "
                "AND DATE(start_time) BETWEEN :ws AND :we"
            ),
            {"uid": user_id, "ws": week_start, "we": week_end}
        ).fetchone()
        total_sessions = int(total_sessions_row[0])
        completion_rate = round((sessions_completed / total_sessions) * 100) if total_sessions > 0 else 0

        # Upcoming deadlines (not done, due >= today)
        deadlines_row = db.session.execute(
            text(
                "SELECT COUNT(*) FROM tasks "
                "WHERE student_id = :uid AND status != 'done' "
                "AND due_date >= :today"
            ),
            {"uid": user_id, "today": today}
        ).fetchone()
        upcoming_deadlines = int(deadlines_row[0])

        # Deadlines due this week
        week_deadlines_row = db.session.execute(
            text(
                "SELECT COUNT(*) FROM tasks "
                "WHERE student_id = :uid AND status != 'done' "
                "AND due_date BETWEEN :today AND :we"
            ),
            {"uid": user_id, "today": today, "we": week_end}
        ).fetchone()
        week_deadlines = int(week_deadlines_row[0])

        # Focus score (from analytics service)
        from app.services.analytics_service import compute_focus_score
        focus_score = compute_focus_score(user_id)

        return success_response(data={
            "weekly_hours":      weekly_hours,
            "sessions_completed": sessions_completed,
            "completion_rate":   completion_rate,
            "upcoming_deadlines": upcoming_deadlines,
            "week_deadlines":    week_deadlines,
            "focus_score":       focus_score,
        })
    except Exception as e:
        return error_response("STATS_ERROR", str(e), status=500)


# ═══════════════════════════════════════════════════════════
# AI TIMETABLE GENERATION
# ═══════════════════════════════════════════════════════════

# ── POST /api/scheduler/generate ─────────────────────────
# Ask Gemini to create a weekly study plan and save to DB
@bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_timetable():
    from datetime import datetime, date, timedelta
    from app.services.ai_service import generate_timetable as ai_generate

    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}

    intensity     = data.get("intensity", "Balanced (4-5 hrs/day)")
    focus_subject = data.get("focus_subject", "General")
    exam_date     = data.get("exam_date", "")

    # Fetch the user's enrolled subjects for context
    try:
        rows = db.session.execute(
            text(
                "SELECT s.name FROM subjects s "
                "JOIN student_subjects ss ON ss.subject_id = s.id "
                "JOIN student_profiles sp ON sp.id = ss.student_id "
                "WHERE sp.user_id = :uid"
            ),
            {"uid": user_id}
        ).fetchall()
        subjects = [r[0] for r in rows] if rows else []
    except Exception:
        subjects = []

    # Ensure focus_subject is included in AI context list
    if focus_subject and focus_subject not in subjects:
        subjects.append(focus_subject)
    if not subjects:
        subjects = ["Mathematics", "Physics", "Chemistry"]

    # Call AI to generate schedule
    try:
        sessions_data = ai_generate(
            intensity=intensity,
            focus_subject=focus_subject,
            exam_date=exam_date,
            subjects=subjects,
        )
    except RuntimeError as e:
        return error_response("AI_ERROR", str(e), status=503)
    except Exception as e:
        return error_response("GENERATE_FAILED", f"AI generation error: {e}", status=500)

    # Calculate the start of the current week (Monday)
    today      = date.today()
    week_start = today - timedelta(days=today.weekday())

    DAY_MAP = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    }

    # Resolve subject_id for each session
    subject_cache = {}
    saved_count   = 0
    saved_sessions = []

    for session in sessions_data:
        try:
            day_name   = session.get("day", "Monday").lower()
            start_str  = session.get("start_time", "08:00")
            end_str    = session.get("end_time",   "10:00")
            subj_name  = session.get("subject", focus_subject)
            sess_type  = session.get("session_type", "study")

            day_offset  = DAY_MAP.get(day_name, 0)
            session_date = week_start + timedelta(days=day_offset)
            start_dt    = datetime.strptime(f"{session_date} {start_str}", "%Y-%m-%d %H:%M")
            end_dt      = datetime.strptime(f"{session_date} {end_str}",   "%Y-%m-%d %H:%M")
            duration    = int((end_dt - start_dt).total_seconds() / 60)

            # Resolve subject_id (cache lookups)
            if subj_name not in subject_cache:
                row = db.session.execute(
                    text("SELECT id FROM subjects WHERE name LIKE :name LIMIT 1"),
                    {"name": f"%{subj_name}%"}
                ).fetchone()
                if row:
                    subject_cache[subj_name] = int(row[0])
                else:
                    # Dynamically create the subject if it doesn't exist
                    import random
                    default_colors = ["#4A90D9", "#E07C3A", "#2A9D8F", "#27AE60", "#7C5CBF", "#888888"]
                    color = random.choice(default_colors)
                    db.session.execute(
                        text("INSERT INTO subjects (name, color_hex) VALUES (:name, :color)"),
                        {"name": subj_name, "color": color}
                    )
                    db.session.commit()
                    new_sub_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                    subject_cache[subj_name] = int(new_sub_id)

            subject_id = subject_cache.get(subj_name)
            if not subject_id:
                continue

            db.session.execute(
                text(
                    "INSERT INTO study_sessions "
                    "(student_id, subject_id, start_time, end_time, duration_min, "
                    "session_type, completed) "
                    "VALUES (:sid, :subid, :start, :end, :dur, :type, 0)"
                ),
                {
                    "sid":   user_id,
                    "subid": subject_id,
                    "start": start_dt,
                    "end":   end_dt,
                    "dur":   duration,
                    "type":  sess_type,
                }
            )
            saved_sessions.append({
                "day":          session.get("day"),
                "start_time":   start_str,
                "end_time":     end_str,
                "subject":      subj_name,
                "session_type": sess_type,
                "duration_min": duration,
            })
            saved_count += 1
        except Exception:
            continue

    db.session.commit()

    return success_response(
        data={
            "sessions_created": saved_count,
            "sessions":         saved_sessions,
            "week_start":       str(week_start),
        },
        message=f"AI generated {saved_count} study sessions for this week",
    )
