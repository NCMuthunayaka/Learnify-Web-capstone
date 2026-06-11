"""
analytics_service.py
────────────────────
Central analytics logic for the Learnify dashboard.
Computes:
  • study_streak_days   – consecutive calendar days the student studied
  • focus_score         – 0-100 rating based on session completion rate this week
  • semester_goal_pct   – stored on student_profiles, reflects overall goal progress
  • total_study_hours   – lifetime completed study minutes → hours
"""
from datetime import date, datetime, timedelta
from sqlalchemy import text
from app.extensions import db


# ── Study Streak ────────────────────────────────────────────────────────────
def compute_study_streak(user_id: int) -> int:
    """
    Count the number of consecutive calendar days (ending today or yesterday)
    on which the student completed at least one study session.
    Returns an integer >= 0.
    """
    try:
        rows = db.session.execute(
            text(
                "SELECT DISTINCT DATE(start_time) AS study_date "
                "FROM study_sessions "
                "WHERE student_id = :uid AND completed = 1 "
                "ORDER BY study_date DESC "
                "LIMIT 365"
            ),
            {"uid": user_id},
        ).fetchall()

        if not rows:
            return 0

        dates = [row[0] for row in rows]  # already date objects from MySQL

        # Normalise to Python date
        dates = [d if isinstance(d, date) else d.date() for d in dates]

        today = date.today()
        streak = 0
        expected = today

        # If the student hasn't studied today, start from yesterday
        if dates[0] != today:
            expected = today - timedelta(days=1)

        for d in dates:
            if d == expected:
                streak += 1
                expected -= timedelta(days=1)
            elif d < expected:
                # Gap found — streak ends
                break

        return streak
    except Exception:
        return 0


# ── Focus Score ─────────────────────────────────────────────────────────────
def compute_focus_score(user_id: int) -> int:
    """
    Weekly focus score (0–100).
    Formula: (completed_sessions / total_sessions) * 100 for the last 7 days.
    If no sessions exist this week, fall back to the last 30 days.
    Returns an integer 0-100.
    """
    try:
        week_ago = datetime.now() - timedelta(days=7)
        row = db.session.execute(
            text(
                "SELECT "
                "  COUNT(*) AS total, "
                "  SUM(completed) AS done "
                "FROM study_sessions "
                "WHERE student_id = :uid AND start_time >= :since"
            ),
            {"uid": user_id, "since": week_ago},
        ).fetchone()

        total = int(row[0]) if row and row[0] else 0
        done  = int(row[1]) if row and row[1] else 0

        if total == 0:
            # Fall back to 30-day window
            month_ago = datetime.now() - timedelta(days=30)
            row = db.session.execute(
                text(
                    "SELECT COUNT(*) AS total, SUM(completed) AS done "
                    "FROM study_sessions "
                    "WHERE student_id = :uid AND start_time >= :since"
                ),
                {"uid": user_id, "since": month_ago},
            ).fetchone()
            total = int(row[0]) if row and row[0] else 0
            done  = int(row[1]) if row and row[1] else 0

        if total == 0:
            return 0

        return round((done / total) * 100)
    except Exception:
        return 0


# ── Semester Goal % ─────────────────────────────────────────────────────────
def get_semester_goal_pct(user_id: int) -> float:
    """
    Returns the semester_goal_pct stored on the student's profile.
    Falls back to computing it from task completion rate if the stored
    value is 0 (i.e. not yet set by the user).
    """
    try:
        row = db.session.execute(
            text(
                "SELECT semester_goal_pct FROM student_profiles "
                "WHERE user_id = :uid"
            ),
            {"uid": user_id},
        ).fetchone()

        stored_pct = float(row[0]) if row and row[0] is not None else 0.0

        if stored_pct > 0:
            return round(stored_pct, 1)

        # Derive from task completion
        row2 = db.session.execute(
            text(
                "SELECT "
                "  COUNT(*) AS total, "
                "  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done "
                "FROM tasks "
                "WHERE student_id = :uid"
            ),
            {"uid": user_id},
        ).fetchone()

        total = int(row2[0]) if row2 and row2[0] else 0
        done  = int(row2[1]) if row2 and row2[1] else 0

        if total == 0:
            return 0.0

        return round((done / total) * 100, 1)
    except Exception:
        return 0.0


# ── Total Study Hours ────────────────────────────────────────────────────────
def compute_total_study_hours(user_id: int) -> float:
    """
    Sum of duration_min for all completed study sessions → hours (rounded to 1 dp).
    """
    try:
        row = db.session.execute(
            text(
                "SELECT COALESCE(SUM(duration_min), 0) "
                "FROM study_sessions "
                "WHERE student_id = :uid AND completed = 1"
            ),
            {"uid": user_id},
        ).fetchone()
        total_min = float(row[0]) if row and row[0] else 0.0
        return round(total_min / 60, 1)
    except Exception:
        return 0.0


# ── Full Analytics Bundle ────────────────────────────────────────────────────
def get_analytics_bundle(user_id: int) -> dict:
    """
    Returns all analytics values in a single dict so the dashboard
    route only needs one call.
    """
    return {
        "study_streak_days":  compute_study_streak(user_id),
        "focus_score":        compute_focus_score(user_id),
        "semester_goal_pct":  get_semester_goal_pct(user_id),
        "total_study_hours":  compute_total_study_hours(user_id),
    }
