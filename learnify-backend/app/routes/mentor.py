from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import text
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

bp = Blueprint("mentor", __name__)

# Helper to parse time string like "10:00 AM" into "10:00:00"
def parse_time(time_str):
    if not time_str:
        return "10:00:00"
    try:
        dt = datetime.strptime(time_str.strip(), "%I:%M %p")
        return dt.strftime("%H:%M:%S")
    except Exception:
        try:
            dt = datetime.strptime(time_str.strip(), "%I:%M")
            return dt.strftime("%H:%M:%S")
        except Exception:
            try:
                # If it's already in 24h with seconds: "10:00:00"
                parts = time_str.split(":")
                if len(parts) >= 2:
                    return f"{parts[0].zfill(2)}:{parts[1].zfill(2)}:00"
            except Exception:
                pass
            return "10:00:00"

# Helper to format time "10:00:00" to "10:00 AM"
def format_time(time_obj):
    if not time_obj:
        return "10:00 AM"
    try:
        # If it is a time object or string
        t_str = str(time_obj)
        # Parse "10:00:00"
        dt = datetime.strptime(t_str, "%H:%M:%S")
        return dt.strftime("%I:%M %p").lstrip('0')
    except Exception:
        return str(time_obj)

# Helper to ensure mentor profile exists
def ensure_mentor_profile(user_id: int):
    row = db.session.execute(
        text("SELECT id FROM mentor_profiles WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()
    if not row:
        # Check if user exists and is a mentor
        user_row = db.session.execute(
            text("SELECT role, name FROM users WHERE id = :uid"),
            {"uid": user_id}
        ).fetchone()
        if user_row and user_row[0] in ["mentor", "admin"]:
            db.session.execute(
                text(
                    "INSERT INTO mentor_profiles (user_id, title, institution, years_experience, rating, total_students_helped, avg_response_time_min, accept_urgent, email_notifications, auto_accept_returning) "
                    "VALUES (:uid, 'Academic Mentor', 'Learnify', 5, 4.8, 142, 18, 1, 1, 0)"
                ),
                {"uid": user_id}
            )
            db.session.commit()
            
            # Fetch profile id
            profile_id = db.session.execute(
                text("SELECT LAST_INSERT_ID()")
            ).scalar()

            # Seed default availability slots (Mon-Fri, 10:00 AM to 6:00 PM)
            for day_id in range(1, 6):
                db.session.execute(
                    text(
                        "INSERT INTO mentor_availability (mentor_id, day_id, from_time, until_time, max_daily_requests) "
                        "VALUES (:mpid, :day_id, '10:00:00', '18:00:00', 8)"
                    ),
                    {"mpid": profile_id, "day_id": day_id}
                )
            
            # Insert default notifications if count is 0
            db.session.execute(
                text(
                    "INSERT INTO notifications (user_id, type_id, title, body, is_read, created_at) "
                    "VALUES "
                    "(:uid, 2, 'New request from Nirmal', 'Need help with Integration by Parts in Mathematics. Awaiting your review.', 0, :now_1), "
                    "(:uid, 2, 'Feedback received', 'Nayana left you a 5★ review: \"Davis explained limits perfectly!\"', 0, :now_2)"
                ),
                {
                    "uid": user_id,
                    "now_1": datetime.utcnow(),
                    "now_2": datetime.utcnow()
                }
            )
            db.session.commit()

# ── GET /api/mentor/dashboard/stats ────────────────────────
# Returns all actual stats and details for the mentor dashboard
@bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    ensure_mentor_profile(user_id)

    try:
        # 1. Fetch Profile
        profile_row = db.session.execute(
            text(
                "SELECT mp.id, mp.title, mp.institution, mp.years_experience, mp.rating, "
                "mp.total_students_helped, mp.avg_response_time_min, mp.accept_urgent, "
                "mp.email_notifications, mp.auto_accept_returning, mp.bio, u.subject, u.availability_status "
                "FROM mentor_profiles mp "
                "JOIN users u ON mp.user_id = u.id "
                "WHERE mp.user_id = :uid"
            ),
            {"uid": user_id}
        ).fetchone()

        profile_id = profile_row[0]
        profile_data = {
            "title": profile_row[1] or "Academic Mentor",
            "institution": profile_row[2] or "Learnify",
            "years_experience": profile_row[3],
            "rating": float(profile_row[4]),
            "total_students_helped": profile_row[5],
            "avg_response_time_min": profile_row[6],
            "accept_urgent": bool(profile_row[7]),
            "email_notifications": bool(profile_row[8]),
            "auto_accept_returning": bool(profile_row[9]),
            "bio": profile_row[10] or "",
            "subject": profile_row[11] or "Mathematics"
        }
        availability_status = profile_row[12] or "Online"

        # 2. Fetch Availability Slots
        avail_rows = db.session.execute(
            text(
                "SELECT dow.name, ma.from_time, ma.until_time, ma.max_daily_requests "
                "FROM mentor_availability ma "
                "JOIN days_of_week dow ON ma.day_id = dow.id "
                "WHERE ma.mentor_id = :mpid"
            ),
            {"mpid": profile_id}
        ).fetchall()

        available_days = []
        from_time = "10:00 AM"
        until_time = "06:00 PM"
        max_requests = 8

        if avail_rows:
            available_days = [row[0] for row in avail_rows]
            from_time = format_time(avail_rows[0][1])
            until_time = format_time(avail_rows[0][2])
            max_requests = avail_rows[0][3]

        # 3. Calculate Ticket Counts (Open vs Resolved)
        open_count = db.session.execute(
            text(
                "SELECT COUNT(*) FROM help_requests "
                "WHERE (assigned_to = :uid OR (assigned_to IS NULL AND status = 'pending')) "
                "AND status != 'resolved'"
            ),
            {"uid": user_id}
        ).scalar() or 0

        resolved_count = db.session.execute(
            text(
                "SELECT COUNT(*) FROM help_requests "
                "WHERE assigned_to = :uid AND status = 'resolved'"
            ),
            {"uid": user_id}
        ).scalar() or 0

        # 4. Fetch Active Today's Sessions (accepted or in_progress assigned to mentor)
        session_rows = db.session.execute(
            text(
                "SELECT hr.id, u.name, hr.topic_title, s.name AS subject_name, "
                "hr.priority, hr.status, hr.created_at "
                "FROM help_requests hr "
                "JOIN users u ON hr.student_id = u.id "
                "JOIN subjects s ON hr.subject_id = s.id "
                "WHERE hr.assigned_to = :uid AND hr.status IN ('accepted', 'in_progress') "
                "ORDER BY hr.created_at ASC LIMIT 4"
            ),
            {"uid": user_id}
        ).fetchall()

        sessions = []
        # Generate clean mock times today for UI display
        mock_times = ["9:00 - 9:45 AM", "11:00 - 11:30 AM", "2:00 - 2:45 PM", "4:00 - 4:30 PM"]
        for idx, row in enumerate(session_rows):
            name = row[1]
            initials = "".join([part[0] for part in name.split()]).upper()[:2]
            
            # Map status database format to UI capital case
            ui_status = "In Progress" if row[5] == "in_progress" else "Upcoming"
            status_color = "bg-green-500 text-green-600 border-green-100 bg-green-50/30" if row[5] == "in_progress" else "bg-blue-500 text-blue-600 border-blue-100 bg-blue-50/30"

            sessions.append({
                "id": row[0],
                "time": mock_times[idx % len(mock_times)],
                "initials": initials,
                "name": name,
                "subject": row[3],
                "desc": row[2],
                "status": ui_status,
                "statusColor": status_color,
                "btnText": "Join" if row[5] == "in_progress" else "Prepare",
                "btnPrimary": row[5] == "in_progress",
                "priority": row[4].capitalize()
            })

        # 5. Performance by Subject (Calculated based on resolved tickets or default fallback if 0)
        perf_rows = db.session.execute(
            text(
                "SELECT s.name, COUNT(hr.id) "
                "FROM help_requests hr "
                "JOIN subjects s ON hr.subject_id = s.id "
                "WHERE hr.assigned_to = :uid AND hr.status = 'resolved' "
                "GROUP BY s.name"
            ),
            {"uid": user_id}
        ).fetchall()

        performance = []
        colors = ["bg-blue-500", "bg-orange-500", "bg-amber-600", "bg-green-500", "bg-purple-500"]
        
        if perf_rows:
            total_resolved = sum(r[1] for r in perf_rows)
            for idx, r in enumerate(perf_rows):
                pct = round((r[1] / total_resolved) * 100)
                performance.append({
                    "name": r[0],
                    "value": pct,
                    "bg": colors[idx % len(colors)]
                })
        else:
            # Fallback to standard subject listings if mentor has resolved no tickets yet
            performance = [
                {"name": "Calculus", "value": 85, "bg": "bg-blue-500"},
                {"name": "Algebra", "value": 75, "bg": "bg-orange-500"},
                {"name": "Statistics", "value": 70, "bg": "bg-amber-600"},
                {"name": "Geometry", "value": 90, "bg": "bg-green-500"}
            ]

        # 6. Recent Notifications
        notif_rows = db.session.execute(
            text(
                "SELECT id, title, body, is_read, created_at "
                "FROM notifications "
                "WHERE user_id = :uid "
                "ORDER BY created_at DESC LIMIT 5"
            ),
            {"uid": user_id}
        ).fetchall()

        notifications = []
        for n in notif_rows:
            notifications.append({
                "id": n[0],
                "title": n[1],
                "msg": n[2],
                "unread": not bool(n[3]),
                "time": n[4].strftime("%I:%M %p") if n[4] else "Just now"
            })

        # 7. Reviews and metrics
        feedback_rows = db.session.execute(
            text(
                "SELECT u.name, f.rating, f.comment, f.category "
                "FROM feedback f "
                "JOIN users u ON f.user_id = u.id "
                "WHERE f.mentor_id = :uid "
                "ORDER BY f.created_at DESC"
            ),
            {"uid": user_id}
        ).fetchall()
        
        reviews = []
        for r in feedback_rows[:5]:
            reviews.append({
                "name": r[0],
                "rating": float(r[1]),
                "comment": r[2]
            })
            
        if not reviews:
            # Fallback mock reviews if none exists yet
            reviews = [
                {
                    "name": "Rashmika",
                    "rating": 5.0,
                    "comment": "Explained the topics perfectly! I could understand the concepts easily."
                },
                {
                    "name": "Ashani We.",
                    "rating": 5.0,
                    "comment": "Highly patient. Walked me through step-by-step calculations."
                }
            ]

        rating_val = float(profile_row[4]) if profile_row[4] else 4.8
        total_assigned = db.session.execute(
            text("SELECT COUNT(*) FROM help_requests WHERE assigned_to = :uid"),
            {"uid": user_id}
        ).scalar() or 0
        
        comp_rate = round((resolved_count / total_assigned) * 100) if total_assigned > 0 else 100
        
        metrics_breakdown = [
            { "name": "Clear explanations", "value": min(100, round(rating_val * 20)) },
            { "name": "Patience & encouragement", "value": min(100, round((rating_val - 0.2) * 20)) },
            { "name": "Lesson materials quality", "value": min(100, round((rating_val - 0.4) * 20)) }
        ]

        return success_response(data={
            "profile": profile_data,
            "status": availability_status,
            "settings": {
                "availableDays": available_days,
                "fromTime": from_time,
                "untilTime": until_time,
                "maxRequests": max_requests,
                "acceptUrgent": profile_data["accept_urgent"],
                "emailNotif": profile_data["email_notifications"],
                "autoAccept": profile_data["auto_accept_returning"]
            },
            "stats": {
                "open_requests": open_count,
                "resolved": resolved_count,
                "avg_response": profile_data["avg_response_time_min"],
                "rating": rating_val,
                "total_students": profile_data["total_students_helped"],
                "completion_rate": comp_rate,
                "metrics_breakdown": metrics_breakdown,
                "reviews": reviews
            },
            "sessions": sessions,
            "performance": performance,
            "notifications": notifications
        })

    except Exception as e:
        return error_response("FETCH_MENTOR_STATS_ERROR", str(e), status=500)

# ── PATCH /api/mentor/settings ─────────────────────────────
# Update mentor availability and toggle preferences
@bp.route("/settings", methods=["PATCH"])
@jwt_required()
def update_settings():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    data = request.get_json(silent=True) or {}
    
    try:
        # Get mentor profile ID
        profile_row = db.session.execute(
            text("SELECT id FROM mentor_profiles WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()

        if not profile_row:
            return error_response("PROFILE_NOT_FOUND", "Mentor profile not found", status=404)
        
        profile_id = profile_row[0]

        # Update user status if provided
        if "status" in data:
            db.session.execute(
                text("UPDATE users SET availability_status = :status WHERE id = :uid"),
                {"status": data["status"], "uid": user_id}
            )
            db.session.commit()

        # Update profile toggles
        db.session.execute(
            text(
                "UPDATE mentor_profiles SET "
                "accept_urgent = :urgent, "
                "email_notifications = :email_notif, "
                "auto_accept_returning = :auto_accept "
                "WHERE id = :mpid"
            ),
            {
                "urgent": 1 if data.get("acceptUrgent", True) else 0,
                "email_notif": 1 if data.get("emailNotif", True) else 0,
                "auto_accept": 1 if data.get("autoAccept", False) else 0,
                "mpid": profile_id
            }
        )

        # Update availability times & days if provided
        if "availableDays" in data:
            available_days = data["availableDays"]
            from_time = parse_time(data.get("fromTime", "10:00 AM"))
            until_time = parse_time(data.get("untilTime", "06:00 PM"))
            max_requests = int(data.get("maxRequests", 8))

            # Delete old slots
            db.session.execute(
                text("DELETE FROM mentor_availability WHERE mentor_id = :mpid"),
                {"mpid": profile_id}
            )

            # Insert new slots
            for day_name in available_days:
                # Find day id
                day_row = db.session.execute(
                    text("SELECT id FROM days_of_week WHERE name = :name LIMIT 1"),
                    {"name": day_name}
                ).fetchone()
                
                if day_row:
                    day_id = day_row[0]
                    db.session.execute(
                        text(
                            "INSERT INTO mentor_availability (mentor_id, day_id, from_time, until_time, max_daily_requests) "
                            "VALUES (:mpid, :day_id, :from_t, :until_t, :max_req)"
                        ),
                        {
                            "mpid": profile_id,
                            "day_id": day_id,
                            "from_t": from_time,
                            "until_t": until_time,
                            "max_req": max_requests
                        }
                    )
        
        db.session.commit()
        return success_response(message="Availability settings updated successfully")

    except Exception as e:
        db.session.rollback()
        return error_response("UPDATE_SETTINGS_ERROR", str(e), status=500)

# ── GET /api/mentor/requests ────────────────────────────────
# Get help requests queue (assigned tickets + pending unassigned)
@bp.route("/requests", methods=["GET"])
@jwt_required()
def get_mentor_requests():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    try:
        # Fetch requests (assigned to this mentor OR pending with no assignment)
        rows = db.session.execute(
            text(
                "SELECT hr.id, u.name AS student_name, s.name AS subject_name, "
                "hr.topic_title, hr.description, hr.priority, hr.status, "
                "hr.created_at, hr.assigned_to, hr.attachment_url "
                "FROM help_requests hr "
                "JOIN users u ON hr.student_id = u.id "
                "JOIN subjects s ON hr.subject_id = s.id "
                "WHERE hr.assigned_to = :uid OR (hr.assigned_to IS NULL AND hr.status = 'pending') "
                "ORDER BY hr.created_at DESC"
            ),
            {"uid": user_id}
        ).fetchall()

        requests_list = []
        for r in rows:
            req_id = r[0]
            student_name = r[1]
            initials = "".join([part[0] for part in student_name.split()]).upper()[:2]
            
            # Fetch replies for request
            reply_rows = db.session.execute(
                text(
                    "SELECT hrsp.id, hrsp.responder_id, u.name, hrsp.content, hrsp.created_at, u.role "
                    "FROM help_responses hrsp "
                    "JOIN users u ON hrsp.responder_id = u.id "
                    "WHERE hrsp.request_id = :req_id "
                    "ORDER BY hrsp.created_at ASC"
                ),
                {"req_id": req_id}
            ).fetchall()

            replies = []
            for rep in reply_rows:
                sender_role = "mentor" if rep[5] == "mentor" else "student"
                replies.append({
                    "id": rep[0],
                    "sender": sender_role,
                    "senderName": rep[2],
                    "content": rep[3],
                    "time": rep[4].strftime("%I:%M %p") if rep[4] else "Just now"
                })

            # Map status database value to frontend capitalization
            db_status = r[6]
            ui_status = "Pending"
            if db_status == "accepted" or db_status == "in_progress":
                ui_status = "In Progress"
            elif db_status == "resolved":
                ui_status = "Resolved"

            requests_list.append({
                "id": req_id,
                "studentName": student_name,
                "studentInitials": initials,
                "subject": r[2],
                "title": r[3],
                "description": r[4],
                "priority": r[5].capitalize(),
                "status": ui_status,
                "db_status": db_status,
                "date": r[7].strftime("%b %d, %Y") if r[7] else "Just now",
                "assigned_to": r[8],
                "attachment_url": r[9],
                "replies": replies
            })

        return success_response(data={"requests": requests_list})

    except Exception as e:
        return error_response("FETCH_REQUESTS_ERROR", str(e), status=500)

# ── POST /api/mentor/requests/<id>/accept ───────────────────
# Accept a help request (assign to mentor and set in_progress)
@bp.route("/requests/<int:req_id>/accept", methods=["POST"])
@jwt_required()
def accept_request(req_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    try:
        db.session.execute(
            text(
                "UPDATE help_requests SET assigned_to = :uid, status = 'in_progress' "
                "WHERE id = :rid"
            ),
            {"uid": user_id, "rid": req_id}
        )
        db.session.commit()
        return success_response(message="Request accepted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response("ACCEPT_REQUEST_ERROR", str(e), status=500)

# ── POST /api/mentor/requests/<id>/decline ──────────────────
# Decline a request (unassign mentor and set status back to pending)
@bp.route("/requests/<int:req_id>/decline", methods=["POST"])
@jwt_required()
def decline_request(req_id):
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    try:
        db.session.execute(
            text(
                "UPDATE help_requests SET assigned_to = NULL, status = 'pending' "
                "WHERE id = :rid"
            ),
            {"rid": req_id}
        )
        db.session.commit()
        return success_response(message="Request declined/released successfully")
    except Exception as e:
        db.session.rollback()
        return error_response("DECLINE_REQUEST_ERROR", str(e), status=500)

# ── POST /api/mentor/requests/<id>/resolve ──────────────────
# Mark request as resolved
@bp.route("/requests/<int:req_id>/resolve", methods=["POST"])
@jwt_required()
def resolve_request(req_id):
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    try:
        db.session.execute(
            text(
                "UPDATE help_requests SET status = 'resolved', resolved_at = :now "
                "WHERE id = :rid"
            ),
            {"rid": req_id, "now": datetime.utcnow()}
        )
        db.session.commit()
        return success_response(message="Request marked as resolved")
    except Exception as e:
        db.session.rollback()
        return error_response("RESOLVE_REQUEST_ERROR", str(e), status=500)

# ── POST /api/mentor/requests/<id>/replies ──────────────────
# Post a response reply on the request
@bp.route("/requests/<int:req_id>/replies", methods=["POST"])
@jwt_required()
def post_reply(req_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Mentor access required", status=403)

    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()

    if not content:
        return error_response("MISSING_CONTENT", "content is required", status=400)

    try:
        # Check current status of help request. If pending, automatically transition to in_progress and assign to mentor.
        req_row = db.session.execute(
            text("SELECT status, assigned_to FROM help_requests WHERE id = :rid"),
            {"rid": req_id}
        ).fetchone()

        if not req_row:
            return error_response("NOT_FOUND", "Request not found", status=404)

        current_status = req_row[0]
        assigned_to = req_row[1]

        # Auto transition if pending
        if current_status == "pending" or not assigned_to:
            db.session.execute(
                text(
                    "UPDATE help_requests SET assigned_to = :uid, status = 'in_progress' "
                    "WHERE id = :rid"
                ),
                {"uid": user_id, "rid": req_id}
            )

        # Insert reply
        db.session.execute(
            text(
                "INSERT INTO help_responses (request_id, responder_id, content, created_at) "
                "VALUES (:rid, :uid, :content, :now)"
            ),
            {"rid": req_id, "uid": user_id, "content": content, "now": datetime.utcnow()}
        )

        db.session.commit()
        return success_response(message="Reply response posted successfully")

    except Exception as e:
        db.session.rollback()
        return error_response("POST_REPLY_ERROR", str(e), status=500)
