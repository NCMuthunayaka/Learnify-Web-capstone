from datetime import datetime, timedelta, date
from sqlalchemy import text
from app.extensions import db


def compute_session_status(session_id: int) -> str:
    """
    Computes status of a study session based on current time and database state.
    Returns: "PENDING", "COMPLETED", "IN_PROGRESS", "MISSED", or "PARTIALLY_WORKED"
    """
    try:
        row = db.session.execute(
            text(
                "SELECT start_time, end_time, duration_min, completed "
                "FROM study_sessions WHERE id = :sid"
            ),
            {"sid": session_id}
        ).fetchone()

        if not row:
            return "NOT_FOUND"

        start_time, end_time, duration_min, completed = row
        now = datetime.now()

        if completed == 1:
            scheduled_dur = int((end_time - start_time).total_seconds() / 60)
            if scheduled_dur > 0 and duration_min < scheduled_dur * 0.5:
                return "PARTIALLY_WORKED"
            return "COMPLETED"

        # If not marked as completed/logged:
        if start_time > now:
            return "PENDING"
        elif start_time <= now <= end_time:
            return "IN_PROGRESS"
        else:
            return "MISSED"
    except Exception:
        return "PENDING"


def get_productivity_metrics(user_id: int, days: int = 7) -> dict:
    """
    Calculate productivity metrics for the student over the last `days` days.
    Returns focus ratio, completed session counts, missed counts, and a daily log.
    """
    try:
        since_date = date.today() - timedelta(days=days - 1)

        # Fetch sessions
        rows = db.session.execute(
            text(
                "SELECT ss.start_time, ss.end_time, ss.duration_min, ss.completed, s.name "
                "FROM study_sessions ss "
                "JOIN subjects s ON ss.subject_id = s.id "
                "WHERE ss.student_id = :uid AND DATE(ss.start_time) >= :since"
            ),
            {"uid": user_id, "since": since_date}
        ).fetchall()

        total_sessions = len(rows)
        completed_sessions = 0
        missed_sessions = 0
        total_scheduled_min = 0
        total_actual_min = 0

        daily_actual = {str(since_date + timedelta(days=i)): 0 for i in range(days)}
        daily_scheduled = {str(since_date + timedelta(days=i)): 0 for i in range(days)}

        for r in rows:
            st, et, actual_min, completed, subj = r
            session_date_str = str(st.date())

            sched_min = int((et - st).total_seconds() / 60)
            total_scheduled_min += sched_min

            if completed == 1:
                completed_sessions += 1
                total_actual_min += actual_min
                if session_date_str in daily_actual:
                    daily_actual[session_date_str] += actual_min
            else:
                if et < datetime.now():
                    missed_sessions += 1

            if session_date_str in daily_scheduled:
                daily_scheduled[session_date_str] += sched_min

        # Format daily log list
        daily_log = []
        for i in range(days):
            d = since_date + timedelta(days=i)
            ds = str(d)
            daily_log.append({
                "date": d.strftime("%b %d"),
                "scheduled_hours": round(daily_scheduled.get(ds, 0) / 60.0, 1),
                "actual_hours": round(daily_actual.get(ds, 0) / 60.0, 1)
            })

        focus_ratio = 100.0
        if total_scheduled_min > 0:
            focus_ratio = min(100.0, (total_actual_min / total_scheduled_min) * 100.0)

        completion_rate = 0.0
        if total_sessions > 0:
            completion_rate = (completed_sessions / total_sessions) * 100.0

        productivity_level = "Needs Focus"
        if completion_rate >= 80:
            productivity_level = "High"
        elif completion_rate >= 40:
            productivity_level = "Moderate"

        return {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "missed_sessions": missed_sessions,
            "scheduled_hours": round(total_scheduled_min / 60.0, 1),
            "actual_hours": round(total_actual_min / 60.0, 1),
            "focus_ratio_pct": round(focus_ratio, 1),
            "completion_rate_pct": round(completion_rate, 1),
            "productivity_level": productivity_level,
            "daily_log": daily_log
        }
    except Exception as e:
        print(f"Error calculating productivity metrics: {e}")
        return {}
