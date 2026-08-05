from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import date, datetime, timedelta

bp = Blueprint("progress", __name__)


def _build_study_hours_chart(user_id):
    """Last 30 days of study hours grouped by date."""
    try:
        since = date.today() - timedelta(days=29)
        rows = db.session.execute(
            text(
                "SELECT DATE(ss.start_time) as d, "
                "ROUND(SUM(ss.duration_min) / 60.0, 2) as hrs "
                "FROM study_sessions ss "
                "WHERE ss.student_id = :uid "
                "AND ss.completed = 1 "
                "AND DATE(ss.start_time) >= :since "
                "GROUP BY DATE(ss.start_time) "
                "ORDER BY DATE(ss.start_time)"
            ),
            {"uid": user_id, "since": since},
        ).fetchall()

        daily = {str(r[0]): float(r[1]) for r in rows}
        chart = []
        for i in range(30):
            d = since + timedelta(days=i)
            ds = str(d)
            chart.append({
                "label": d.strftime("%b %d"),
                "hours": daily.get(ds, 0),
            })
        return chart
    except Exception:
        return []


def _build_subject_time_allocation(user_id):
    """Total study hours per subject (last 30 days)."""
    PALETTE = ["#4A7FA7", "#1A3D63", "#7aadcc", "#a8cbea", "#B3CFE5",
               "#5dade2", "#2e86c1", "#85c1e9"]
    try:
        rows = db.session.execute(
            text(
                "SELECT s.name, ROUND(SUM(ss.duration_min) / 60.0, 1) as hrs "
                "FROM study_sessions ss "
                "JOIN subjects s ON ss.subject_id = s.id "
                "WHERE ss.student_id = :uid "
                "AND ss.completed = 1 "
                "AND DATE(ss.start_time) >= :since "
                "GROUP BY s.id, s.name "
                "ORDER BY hrs DESC "
                "LIMIT 8"
            ),
            {"uid": user_id, "since": date.today() - timedelta(days=29)},
        ).fetchall()

        total = sum(float(r[1]) for r in rows) or 1
        return [
            {
                "label": r[0],
                "value": round(float(r[1]) / total * 100),
                "color": PALETTE[i % len(PALETTE)],
            }
            for i, r in enumerate(rows)
        ]
    except Exception:
        return []


def _build_subject_progress(user_id):
    """Task completion % per subject across student_subjects, tasks, or study_sessions."""
    BAR_COLORS = ["green", "blue", "amber", "red", "green", "blue"]
    try:
        subj_rows = db.session.execute(
            text(
                "SELECT DISTINCT s.id, s.name "
                "FROM subjects s "
                "WHERE s.id IN ("
                "  SELECT subject_id FROM student_subjects ss JOIN student_profiles sp ON ss.student_id = sp.id WHERE sp.user_id = :uid "
                "  UNION "
                "  SELECT subject_id FROM study_sessions WHERE student_id = :uid "
                "  UNION "
                "  SELECT subject_id FROM tasks WHERE student_id = :uid"
                ") ORDER BY s.name"
            ),
            {"uid": user_id}
        ).fetchall()

        result = []
        for i, s_row in enumerate(subj_rows):
            sub_id, sub_name = s_row
            task_stat = db.session.execute(
                text(
                    "SELECT COUNT(id), SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) "
                    "FROM tasks WHERE student_id = :uid AND subject_id = :sid"
                ),
                {"uid": user_id, "sid": sub_id}
            ).fetchone()
            
            total_tasks = task_stat[0] if task_stat else 0
            done_tasks = int(task_stat[1]) if task_stat and task_stat[1] is not None else 0
            
            if total_tasks > 0:
                pct = round(done_tasks / total_tasks * 100)
            else:
                sess_stat = db.session.execute(
                    text(
                        "SELECT COUNT(id), SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) "
                        "FROM study_sessions WHERE student_id = :uid AND subject_id = :sid"
                    ),
                    {"uid": user_id, "sid": sub_id}
                ).fetchone()
                tot_sess = sess_stat[0] if sess_stat else 0
                done_sess = int(sess_stat[1]) if sess_stat and sess_stat[1] is not None else 0
                pct = round(done_sess / tot_sess * 100) if tot_sess > 0 else 0

            result.append({
                "name": sub_name,
                "pct": pct,
                "color": BAR_COLORS[i % len(BAR_COLORS)],
            })
        return result
    except Exception as e:
        print(f"Error in _build_subject_progress: {e}")
        return []


def _build_streak_heatmap(user_id):
    """4-week heatmap grid (Mon-Sun, intensity 0-5)."""
    try:
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        start = monday - timedelta(weeks=3)

        rows = db.session.execute(
            text(
                "SELECT DATE(start_time) as d, "
                "ROUND(SUM(duration_min) / 60.0, 1) as hrs "
                "FROM study_sessions "
                "WHERE student_id = :uid "
                "AND completed = 1 "
                "AND DATE(start_time) >= :start "
                "GROUP BY DATE(start_time)"
            ),
            {"uid": user_id, "start": start},
        ).fetchall()

        hrs_map = {str(r[0]): float(r[1]) for r in rows}

        def to_intensity(h):
            if h == 0:   return 0
            if h < 1:    return 1
            if h < 2:    return 2
            if h < 3:    return 3
            if h < 5:    return 4
            return 5

        weeks = []
        for w in range(4):
            week = []
            for d in range(7):
                day = start + timedelta(weeks=w, days=d)
                future = day > today
                week.append(0 if future else to_intensity(hrs_map.get(str(day), 0)))
            weeks.append(week)
        return weeks
    except Exception:
        return [[0]*7]*4


def _build_streak_count(user_id):
    """Count of consecutive days with any study session up to today."""
    try:
        today = date.today()
        streak = 0
        for i in range(365):
            d = today - timedelta(days=i)
            row = db.session.execute(
                text(
                    "SELECT COUNT(*) FROM study_sessions "
                    "WHERE student_id = :uid "
                    "AND DATE(start_time) = :d"
                ),
                {"uid": user_id, "d": d},
            ).scalar()
            if row and int(row) > 0:
                streak += 1
            else:
                break
        return streak
    except Exception:
        return 0


def _build_tasks(user_id):
    """Upcoming tasks (not done) ordered by due date."""
    try:
        rows = db.session.execute(
            text(
                "SELECT t.id, t.title, s.name as subject, t.due_date, t.status "
                "FROM tasks t "
                "JOIN subjects s ON t.subject_id = s.id "
                "WHERE t.student_id = :uid "
                "AND t.status != 'done' "
                "ORDER BY t.due_date ASC "
                "LIMIT 10"
            ),
            {"uid": user_id},
        ).fetchall()

        today = date.today()
        result = []
        for r in rows:
            due = r[3]
            delta = (due - today).days if due else 999
            if delta < 0:
                due_label = "Overdue"
                due_type = "urgent"
            elif delta == 0:
                due_label = "Today"
                due_type = "urgent"
            elif delta == 1:
                due_label = "Tomorrow"
                due_type = "soon"
            elif delta <= 7:
                due_label = due.strftime("%b %d")
                due_type = "soon"
            else:
                due_label = due.strftime("%b %d")
                due_type = "ok"

            result.append({
                "id": r[0],
                "name": r[1],
                "subject": r[2],
                "due": due_label,
                "dueType": due_type,
                "done": r[4] == "done",
            })
        return result
    except Exception:
        return []


def _build_top_stats(user_id):
    """Overall stats: total study hours this month, tasks & study sessions done/total, streak."""
    try:
        month_start = date.today().replace(day=1)
        total_hrs = db.session.execute(
            text(
                "SELECT ROUND(SUM(duration_min) / 60.0, 1) "
                "FROM study_sessions "
                "WHERE student_id = :uid "
                "AND completed = 1 "
                "AND DATE(start_time) >= :ms"
            ),
            {"uid": user_id, "ms": month_start},
        ).scalar() or 0

        # Combine tasks and study sessions for overall academic progress
        counts = db.session.execute(
            text(
                "SELECT "
                "(SELECT COUNT(*) FROM tasks WHERE student_id = :uid) + "
                "(SELECT COUNT(*) FROM study_sessions WHERE student_id = :uid) as total, "
                "(SELECT COUNT(*) FROM tasks WHERE student_id = :uid AND status = 'done') + "
                "(SELECT COUNT(*) FROM study_sessions WHERE student_id = :uid AND completed = 1) as done"
            ),
            {"uid": user_id},
        ).fetchone()

        total_tasks = int(counts[0]) if counts and counts[0] else 0
        done_tasks = int(counts[1]) if counts and counts[1] is not None else 0

        today = date.today()
        week_end = today + timedelta(days=7)

        due_week = db.session.execute(
            text(
                "SELECT "
                "(SELECT COUNT(*) FROM tasks WHERE student_id = :uid AND status != 'done' AND due_date BETWEEN :today AND :week_end) + "
                "(SELECT COUNT(*) FROM study_sessions WHERE student_id = :uid AND completed = 0 AND DATE(start_time) BETWEEN :today AND :week_end)"
            ),
            {"uid": user_id, "today": today, "week_end": week_end},
        ).scalar() or 0

        overall_pct = round(done_tasks / total_tasks * 100) if total_tasks > 0 else 0

        return {
            "study_hours_month": float(total_hrs),
            "tasks_done": done_tasks,
            "tasks_total": total_tasks,
            "tasks_due_week": int(due_week),
            "overall_pct": overall_pct,
        }
    except Exception as e:
        print(f"Error in _build_top_stats: {e}")
        return {
            "study_hours_month": 0,
            "tasks_done": 0,
            "tasks_total": 0,
            "tasks_due_week": 0,
            "overall_pct": 0,
        }



def _build_leaderboard(user_id):
    try:
        rows = db.session.execute(
            text(
                "SELECT u.id, u.name, sp.total_points "
                "FROM student_profiles sp "
                "JOIN users u ON sp.user_id = u.id "
                "ORDER BY sp.total_points DESC "
                "LIMIT 5"
            )
        ).fetchall()

        entries = []
        for rank, r in enumerate(rows, 1):
            uid, name, pts = r
            names = name.split()
            initials = "".join([n[0] for n in names[:2]]).upper() if names else "U"
            
            entries.append({
                "rank": rank,
                "rankClass": "text-[#c8900a]" if rank == 1 else "text-[#7a8fa0]" if rank == 2 else "text-[#b07040]" if rank == 3 else "text-[#4A7FA7]" if rank == 4 else "text-[#8AAABF]",
                "initials": initials,
                "name": name if uid != user_id else "You",
                "pts": f"{pts:,}",
                "isMe": uid == user_id
            })
            
        return entries
    except Exception:
        return []


def _build_recent_activity(user_id):
    try:
        activities = []
        now_dt = datetime.now()

        # 1. Study sessions (completed or scheduled)
        sessions = db.session.execute(
            text(
                "SELECT ss.start_time, s.name, ss.duration_min, ss.ai_suggested, ss.session_type, ss.completed "
                "FROM study_sessions ss "
                "JOIN subjects s ON ss.subject_id = s.id "
                "WHERE ss.student_id = :uid "
                "ORDER BY ss.start_time DESC "
                "LIMIT 5"
            ),
            {"uid": user_id}
        ).fetchall()

        for s in sessions:
            st_time, subj, dur, ai_sugg, s_type, comp = s
            title = f"AI Session — {dur} min" if ai_sugg else ("Completed Study Session" if comp else "Scheduled Study Session")
            desc = f"{subj} · {dur} min"
            icon = "🤖" if ai_sugg else ("📚" if comp else "📅")
            color = "bg-[#fff3e0]" if ai_sugg else ("bg-[#deeef8]" if comp else "bg-[#eef4f8]")
            
            activities.append({
                "timestamp": st_time,
                "color": color,
                "icon": icon,
                "title": title,
                "desc": desc
            })

        # 2. Submitted tasks
        tasks = db.session.execute(
            text(
                "SELECT t.created_at, t.title, s.name "
                "FROM tasks t "
                "JOIN subjects s ON t.subject_id = s.id "
                "WHERE t.student_id = :uid "
                "AND t.status = 'done' "
                "ORDER BY t.created_at DESC "
                "LIMIT 5"
            ),
            {"uid": user_id}
        ).fetchall()

        for t in tasks:
            created_at, title, subj = t
            activities.append({
                "timestamp": created_at,
                "color": "bg-[#e6f7ed]",
                "icon": "✅",
                "title": "Submitted Assignment",
                "desc": f"{title} · {subj}"
            })

        # 3. Missed study sessions
        missed = db.session.execute(
            text(
                "SELECT ss.start_time, s.name, ss.duration_min "
                "FROM study_sessions ss "
                "JOIN subjects s ON ss.subject_id = s.id "
                "WHERE ss.student_id = :uid "
                "AND ss.completed = 0 "
                "AND ss.end_time < :now "
                "ORDER BY ss.start_time DESC "
                "LIMIT 5"
            ),
            {"uid": user_id, "now": now_dt}
        ).fetchall()

        for m in missed:
            st_time, subj, dur = m
            activities.append({
                "timestamp": st_time,
                "color": "bg-[#fdecea]",
                "icon": "📅",
                "title": "Missed Study Slot",
                "desc": f"{subj} · {dur} min unattended"
            })

        # Sort all by timestamp desc and take top 5
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        top_activities = activities[:5]

        # Format time for display (e.g., "2h ago", "Yesterday", "June 15")
        for act in top_activities:
            ts = act["timestamp"]
            diff = now_dt - ts
            if diff.days == 0:
                if diff.seconds < 3600:
                    mins = diff.seconds // 60
                    act["time"] = f"{mins}m ago" if mins > 0 else "Just now"
                else:
                    hrs = diff.seconds // 3600
                    act["time"] = f"{hrs}h ago"
            elif diff.days == 1:
                act["time"] = "Yesterday"
            else:
                act["time"] = ts.strftime("%b %d")
            del act["timestamp"]

        return top_activities
    except Exception as e:
        print(f"Error in _build_recent_activity: {e}")
        return []


def _build_monthly_score_trend(user_id):
    try:
        # Get enrolled / active subjects for student
        subj_rows = db.session.execute(
            text(
                "SELECT DISTINCT s.id, s.name "
                "FROM subjects s "
                "WHERE s.id IN ("
                "  SELECT subject_id FROM student_subjects ss JOIN student_profiles sp ON ss.student_id = sp.id WHERE sp.user_id = :uid "
                "  UNION "
                "  SELECT subject_id FROM student_subjects WHERE student_id = :uid "
                "  UNION "
                "  SELECT subject_id FROM study_sessions WHERE student_id = :uid "
                "  UNION "
                "  SELECT subject_id FROM tasks WHERE student_id = :uid"
                ") ORDER BY s.name"
            ),
            {"uid": user_id}
        ).fetchall()
        subjects = [r[1] for r in subj_rows]

        if not subjects:
            all_subs = db.session.execute(text("SELECT name FROM subjects LIMIT 6")).fetchall()
            subjects = [r[0] for r in all_subs]

        subjects = subjects[:6]
        if not subjects:
            return {
                "labels": [],
                "datasets": [],
                "empty": True
            }

        # Calculate last 3 months
        today = date.today()
        months_info = []
        for i in range(2, -1, -1):
            m_year = today.year
            m_num = today.month - i
            if m_num <= 0:
                m_num += 12
                m_year -= 1
            target_start = date(m_year, m_num, 1)

            next_m_num = m_num + 1
            next_m_year = m_year
            if next_m_num > 12:
                next_m_num = 1
                next_m_year += 1
            target_end = date(next_m_year, next_m_num, 1) - timedelta(days=1)

            months_info.append({
                "name": target_start.strftime("%b"),
                "start": target_start,
                "end": target_end
            })

        months = [m["name"] for m in months_info]
        scores_map = {sub: [0, 0, 0] for sub in subjects}

        for sub in subjects:
            for m_idx, m_info in enumerate(months_info):
                # 1. Query progress snapshots first
                snap_row = db.session.execute(
                    text(
                        "SELECT AVG(ps.avg_score) "
                        "FROM progress_snapshots ps "
                        "JOIN subjects s ON ps.subject_id = s.id "
                        "WHERE ps.student_id = :uid AND s.name = :sub_name "
                        "AND ps.snapshot_date BETWEEN :mstart AND :mend "
                        "AND ps.avg_score IS NOT NULL"
                    ),
                    {"uid": user_id, "sub_name": sub, "mstart": m_info["start"], "mend": m_info["end"]}
                ).fetchone()

                if snap_row and snap_row[0] is not None:
                    scores_map[sub][m_idx] = float(snap_row[0])
                else:
                    # 2. Calculate actual task completion & session completion rate
                    t_row = db.session.execute(
                        text(
                            "SELECT COUNT(*), SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) "
                            "FROM tasks "
                            "WHERE student_id = :uid AND subject_id = (SELECT id FROM subjects WHERE name = :sub_name) "
                            "AND DATE(created_at) <= :dlimit"
                        ),
                        {"uid": user_id, "sub_name": sub, "dlimit": m_info["end"]}
                    ).fetchone()

                    s_row = db.session.execute(
                        text(
                            "SELECT COUNT(*), SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) "
                            "FROM study_sessions "
                            "WHERE student_id = :uid AND subject_id = (SELECT id FROM subjects WHERE name = :sub_name) "
                            "AND DATE(start_time) <= :dlimit"
                        ),
                        {"uid": user_id, "sub_name": sub, "dlimit": m_info["end"]}
                    ).fetchone()

                    t_total = t_row[0] if t_row else 0
                    t_done = t_row[1] if t_row and t_row[1] is not None else 0
                    s_total = s_row[0] if s_row else 0
                    s_done = s_row[1] if s_row and s_row[1] is not None else 0

                    rates = []
                    if t_total > 0:
                        rates.append((t_done / t_total) * 100.0)
                    if s_total > 0:
                        rates.append((s_done / s_total) * 100.0)

                    if rates:
                        scores_map[sub][m_idx] = sum(rates) / len(rates)
                    else:
                        scores_map[sub][m_idx] = 0

        datasets = []
        bg_colors = ["rgba(179,207,229,0.75)", "rgba(74,127,167,0.65)", "#1A3D63"]
        for m_idx, month_name in enumerate(months):
            datasets.append({
                "label": month_name,
                "data": [round(scores_map[sub][m_idx], 1) for sub in subjects],
                "backgroundColor": bg_colors[m_idx % len(bg_colors)],
                "borderRadius": 5
            })

        return {
            "labels": subjects,
            "datasets": datasets,
            "empty": len(subjects) == 0
        }
    except Exception as e:
        print(f"Error in _build_monthly_score_trend: {e}")
        return {
            "labels": [],
            "datasets": [],
            "empty": True
        }


# ── GET /api/progress/summary ─────────────────────────────
@bp.route("/summary", methods=["GET"])
@jwt_required()
def get_progress_summary():
    user_id = int(get_jwt_identity())
    try:
        streak = _build_streak_count(user_id)
        return success_response(data={
            "stats":          _build_top_stats(user_id),
            "streak_days":    streak,
            "study_chart":    _build_study_hours_chart(user_id),
            "time_alloc":     _build_subject_time_allocation(user_id),
            "subject_progress": _build_subject_progress(user_id),
            "heatmap":        _build_streak_heatmap(user_id),
            "tasks":          _build_tasks(user_id),
            "leaderboard":     _build_leaderboard(user_id),
            "recent_activity": _build_recent_activity(user_id),
            "monthly_scores":  _build_monthly_score_trend(user_id),
        })
    except Exception as e:
        return error_response("PROGRESS_ERROR", str(e), status=500)


# ── GET /api/progress/report ──────────────────────────────
@bp.route("/report", methods=["GET"])
@jwt_required()
def get_progress_report():
    user_id = int(get_jwt_identity())
    try:
        # Gather user performance statistics
        stats = _build_top_stats(user_id)
        streak = _build_streak_count(user_id)
        subject_progress = _build_subject_progress(user_id)

        # Build clean prompt for the AI analysis report
        subjects_detail = []
        for sp in subject_progress:
            subjects_detail.append(f"- {sp['name']}: {sp['pct']}% task completion")

        subjects_str = "\n".join(subjects_detail) if subjects_detail else "No subjects or tasks recorded yet."

        user_name_row = db.session.execute(
            text("SELECT name FROM users WHERE id = :uid"),
            {"uid": user_id}
        ).fetchone()
        user_name = user_name_row[0] if user_name_row else "Student"

        # Ask the AI service to generate a report
        from app.services.ai_service import get_ai_response

        prompt = (
            f"Please generate a comprehensive, personalized Monthly Study Analysis and Performance Report for a student named {user_name}.\n\n"
            f"Here are their performance metrics for this month:\n"
            f"- Study Hours: {stats.get('study_hours_month', 0)} hours\n"
            f"- Completed Tasks: {stats.get('tasks_done', 0)} of {stats.get('tasks_total', 0)} total tasks\n"
            f"- Current Study Streak: {streak} days\n"
            f"Subject-wise Task Completion Rates:\n"
            f"{subjects_str}\n\n"
            f"Requirements for the report:\n"
            f"1. Structure it into 3 clear sections: 'Monthly Overview', 'Strengths & Weaknesses', and 'Actionable Recommendations'.\n"
            f"2. Keep the analysis constructive, encouraging, and tailored to their active subjects.\n"
            f"3. Return the response in clean Markdown with appropriate formatting. Do not include markdown code block backticks (e.g. ```markdown) in your outer response."
        )

        # Get AI response (pass empty history for clean analysis)
        ai_report = get_ai_response(prompt, history=[])

        return success_response(data={"report": ai_report})
    except Exception as e:
        return error_response("REPORT_ERROR", str(e), status=500)

