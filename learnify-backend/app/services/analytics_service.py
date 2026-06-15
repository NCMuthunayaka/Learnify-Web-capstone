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


# ── Student Profile Helper ──────────────────────────────────────────────────
def ensure_student_profile(user_id: int) -> None:
    """
    Ensure the user has a record in student_profiles if they are a student.
    """
    try:
        row = db.session.execute(
            text("SELECT id FROM student_profiles WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()
        if not row:
            # Check if user exists and is a student
            user_row = db.session.execute(
                text("SELECT role FROM users WHERE id = :uid"),
                {"uid": user_id}
            ).fetchone()
            if user_row and user_row[0] == "student":
                db.session.execute(
                    text(
                        "INSERT INTO student_profiles (user_id, available_hours_per_week, study_streak_days, total_points, semester_goal_pct) "
                        "VALUES (:uid, 0, 0, 0, 0.0)"
                    ),
                    {"uid": user_id}
                )
                db.session.commit()
    except Exception:
        db.session.rollback()


# ── Study Streak ────────────────────────────────────────────────────────────
def compute_study_streak(user_id: int) -> int:
    """
    Count the number of consecutive calendar days (ending today or yesterday)
    on which the student completed at least one study session.
    Returns an integer >= 0.
    """
    ensure_student_profile(user_id)
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
            db.session.execute(
                text("UPDATE student_profiles SET study_streak_days = 0 WHERE user_id = :uid"),
                {"uid": user_id}
            )
            db.session.commit()
            return 0

        # Normalize to Python date
        clean_dates = []
        for row in rows:
            d = row[0]
            val = None
            if isinstance(d, datetime):
                val = d.date()
            elif isinstance(d, date):
                val = d
            elif isinstance(d, str):
                try:
                    val = datetime.strptime(d.split()[0], "%Y-%m-%d").date()
                except ValueError:
                    pass
            if val and val not in clean_dates:
                clean_dates.append(val)

        clean_dates.sort(reverse=True)

        if not clean_dates:
            db.session.execute(
                text("UPDATE student_profiles SET study_streak_days = 0 WHERE user_id = :uid"),
                {"uid": user_id}
            )
            db.session.commit()
            return 0

        today = date.today()
        
        # If the latest study session is older than yesterday, the streak is broken
        if clean_dates[0] < today - timedelta(days=1):
            db.session.execute(
                text("UPDATE student_profiles SET study_streak_days = 0 WHERE user_id = :uid"),
                {"uid": user_id}
            )
            db.session.commit()
            return 0

        streak = 0
        expected = clean_dates[0]

        for d in clean_dates:
            if d == expected:
                streak += 1
                expected -= timedelta(days=1)
            elif d < expected:
                # Gap found — streak ends
                break

        # Save computed streak back to profile
        db.session.execute(
            text(
                "UPDATE student_profiles "
                "SET study_streak_days = :streak "
                "WHERE user_id = :uid"
            ),
            {"streak": streak, "uid": user_id}
        )
        db.session.commit()

        return streak
    except Exception:
        db.session.rollback()
        return 0


# ── Focus Score ─────────────────────────────────────────────────────────────
def compute_focus_score(user_id: int) -> int:
    """
    Weekly focus score (0–100).
    Formula: (completed_sessions / total_sessions) * 100 for the last 7 days.
    If no sessions exist this week, fall back to the last 30 days.
    Returns an integer 0-100.
    """
    ensure_student_profile(user_id)
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
    ensure_student_profile(user_id)
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
    ensure_student_profile(user_id)
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


# ── Achievements check ───────────────────────────────────────────────────────
def check_and_award_achievements(user_id: int) -> list:
    """
    Check if the user qualifies for any achievements and insert new ones
    into user_achievements table. Returns list of names of achievements newly earned.
    """
    newly_earned = []
    try:
        # Get user's profile ID
        profile_row = db.session.execute(
            text("SELECT id, study_streak_days FROM student_profiles WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()
        if not profile_row:
            return []
        
        profile_id = profile_row[0]
        streak_days = profile_row[1]
        
        # Get list of achievements already earned
        earned_rows = db.session.execute(
            text("SELECT achievement_id FROM user_achievements WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchall()
        earned_ids = {r[0] for r in earned_rows}
        
        # Get all defined achievements
        ach_rows = db.session.execute(
            text("SELECT id, name, trigger_type_id, threshold FROM achievements")
        ).fetchall()
        
        for ach_id, name, trigger_type_id, threshold in ach_rows:
            if ach_id in earned_ids:
                continue
                
            earned = False
            
            # Check conditions based on trigger type
            if trigger_type_id == 1: # streak
                if streak_days >= threshold:
                    earned = True
            elif trigger_type_id == 2: # tasks
                # Count completed tasks in the last 7 days
                from datetime import date as date_type, timedelta
                seven_days_ago = date_type.today() - timedelta(days=7)
                count_row = db.session.execute(
                    text("SELECT COUNT(*) FROM tasks WHERE student_id = :uid AND status = 'done' AND due_date >= :since"),
                    {"uid": user_id, "since": seven_days_ago}
                ).fetchone()
                if count_row and count_row[0] >= threshold:
                    earned = True
            elif trigger_type_id == 3: # requests / responses
                if name == "Help Seeker":
                    # Count help requests submitted
                    count_row = db.session.execute(
                        text("SELECT COUNT(*) FROM help_requests WHERE student_id = :uid"),
                        {"uid": user_id}
                    ).fetchone()
                    if count_row and count_row[0] >= threshold:
                        earned = True
                elif name == "Community Helper":
                    # Count help responses submitted
                    count_row = db.session.execute(
                        text("SELECT COUNT(*) FROM help_responses WHERE responder_id = :uid"),
                        {"uid": user_id}
                    ).fetchone()
                    if count_row and count_row[0] >= threshold:
                        earned = True
            
            if earned:
                db.session.execute(
                    text("INSERT INTO user_achievements (user_id, achievement_id) VALUES (:uid, :aid)"),
                    {"uid": user_id, "aid": ach_id}
                )
                newly_earned.append(name)
                
        if newly_earned:
            db.session.commit()
            
    except Exception as e:
        db.session.rollback()
        print(f"Error checking achievements: {e}")
        
    return newly_earned


# ── Update Daily Progress Snapshot ──────────────────────────────────────────
def update_daily_progress_snapshot(user_id: int, subject_id: int, snapshot_date) -> None:
    """
    Insert or update progress snapshot for user, subject, and date.
    Calculates completed hours and task completion percentages.
    """
    try:
        # Calculate study hours on snapshot_date
        hours_row = db.session.execute(
            text(
                "SELECT COALESCE(SUM(duration_min), 0) "
                "FROM study_sessions "
                "WHERE student_id = :uid AND subject_id = :subid "
                "AND DATE(start_time) = :sdate AND completed = 1"
            ),
            {"uid": user_id, "subid": subject_id, "sdate": snapshot_date}
        ).fetchone()
        study_hours = float(hours_row[0]) / 60.0

        # Calculate task completion percentage for that student & subject
        task_row = db.session.execute(
            text(
                "SELECT COUNT(*), SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) "
                "FROM tasks "
                "WHERE student_id = :uid AND subject_id = :subid AND due_date <= :sdate"
            ),
            {"uid": user_id, "subid": subject_id, "sdate": snapshot_date}
        ).fetchone()
        
        total_tasks = task_row[0] if task_row else 0
        completed_tasks = task_row[1] if task_row and task_row[1] is not None else 0
        completion_pct = (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 0.0

        avg_score = None

        # Upsert progress snapshot
        snap_row = db.session.execute(
            text(
                "SELECT id FROM progress_snapshots "
                "WHERE student_id = :uid AND subject_id = :subid AND snapshot_date = :sdate"
            ),
            {"uid": user_id, "subid": subject_id, "sdate": snapshot_date}
        ).fetchone()
        
        if snap_row:
            db.session.execute(
                text(
                    "UPDATE progress_snapshots "
                    "SET study_hours = :hours, completion_pct = :comp_pct, avg_score = :avg "
                    "WHERE id = :sid"
                ),
                {"hours": study_hours, "comp_pct": completion_pct, "avg": avg_score, "sid": snap_row[0]}
            )
        else:
            db.session.execute(
                text(
                    "INSERT INTO progress_snapshots (student_id, subject_id, snapshot_date, study_hours, completion_pct, avg_score) "
                    "VALUES (:uid, :subid, :sdate, :hours, :comp_pct, :avg)"
                ),
                {"uid": user_id, "subid": subject_id, "sdate": snapshot_date, "hours": study_hours, "comp_pct": completion_pct, "avg": avg_score}
            )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error updating progress snapshot: {e}")
