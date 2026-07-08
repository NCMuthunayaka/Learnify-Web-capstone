from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

bp = Blueprint("help_requests", __name__)

# ── GET /api/help_requests ─────────────────────────────────
# Get all help requests created by the current student user
@bp.route("", methods=["GET"])
@jwt_required()
def get_help_requests():
    user_id = int(get_jwt_identity())

    try:
        rows = db.session.execute(
            text(
                "SELECT hr.id, hr.subject_id, s.name AS subject_name, "
                "hr.topic_title, hr.description, hr.priority, hr.status, "
                "hr.assigned_to, u.name AS helper_name, hr.created_at, "
                "s.color_hex, hr.attachment_url "
                "FROM help_requests hr "
                "JOIN subjects s ON hr.subject_id = s.id "
                "LEFT JOIN users u ON hr.assigned_to = u.id "
                "WHERE hr.student_id = :sid "
                "ORDER BY hr.created_at DESC"
            ),
            {"sid": user_id}
        ).fetchall()

        requests_list = []
        for row in rows:
            req_id = row[0]
            
            # Fetch responses for this request
            resp_rows = db.session.execute(
                text(
                    "SELECT r.content, r.created_at, u.name AS responder_name, u.role AS responder_role "
                    "FROM help_responses r "
                    "JOIN users u ON r.responder_id = u.id "
                    "WHERE r.request_id = :req_id "
                    "ORDER BY r.created_at ASC"
                ),
                {"req_id": req_id}
            ).fetchall()

            replies = [
                {
                    "content": r[0],
                    "created_at": r[1].isoformat() if r[1] else None,
                    "responder_name": r[2],
                    "responder_role": r[3]
                }
                for r in resp_rows
            ]

            requests_list.append({
                "id": req_id,
                "subject_id": row[1],
                "subject_name": row[2],
                "title": row[3],
                "description": row[4],
                "priority": row[5].capitalize() if row[5] else "Medium",
                "status": row[6].capitalize() if row[6] else "Pending",
                "assigned_to": row[7],
                "helper_name": row[8] or "Unassigned",
                "created_at": row[9].isoformat() if row[9] else None,
                "color_hex": row[10],
                "attachment_url": row[11],
                "replies": replies,
                # For compatibility with mock UI:
                "subject": row[2],
                "desc": row[4],
                "helperName": row[8] or "Pending Assignment",
                "helperRole": "Mentor" if row[8] else "Unassigned",
                "helperInitials": "".join([part[0] for part in (row[8] or "Pending").split()]).upper()[:2],
                "helperColor": "primary" if row[7] else "gray",
                "date": row[9].strftime("%b %d, %Y") if row[9] else "",
                "badgeColor": "success" if row[6] == "resolved" else ("blue" if row[6] == "in_progress" else "warning"),
                "reply": replies[-1]["content"] if replies else None
            })

        return success_response(data={"requests": requests_list})
    except Exception as e:
        return error_response("FETCH_REQUESTS_ERROR", str(e), status=500)

# ── POST /api/help_requests ────────────────────────────────
# Submit a new help request
@bp.route("", methods=["POST"])
@jwt_required()
def create_help_request():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    required = ["title", "description", "subject"]
    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    title = data["title"].strip()
    description = data["description"].strip()
    subject_input = data["subject"]  # Can be subject name or ID
    priority_input = data.get("priority", "medium").lower() # low, medium, high
    request_type = data.get("request_type", "mentor").lower() # mentor, peer
    assigned_to_id = data.get("assigned_to") # optional
    attachment_url = data.get("attachment_url") # optional

    if priority_input not in ["low", "medium", "high"]:
        priority_input = "medium"
    if request_type not in ["mentor", "peer"]:
        request_type = "mentor"

    try:
        # Resolve subject_id
        subject_id = None
        try:
            subject_id = int(subject_input)
        except ValueError:
            # Look up by name
            sub_row = db.session.execute(
                text("SELECT id FROM subjects WHERE name = :name LIMIT 1"),
                {"name": subject_input}
            ).fetchone()
            if sub_row:
                subject_id = sub_row[0]
            else:
                # Default to Mathematics
                sub_row = db.session.execute(
                    text("SELECT id FROM subjects LIMIT 1")
                ).fetchone()
                subject_id = sub_row[0] if sub_row else 1

        # Resolve assigned_to_id if sent as a string name or dict
        if isinstance(assigned_to_id, str) and assigned_to_id.strip():
            # Check if name is sent and look up ID
            mentor_row = db.session.execute(
                text("SELECT id FROM users WHERE name = :name AND role = 'mentor' LIMIT 1"),
                {"name": assigned_to_id.strip()}
            ).fetchone()
            if mentor_row:
                assigned_to_id = mentor_row[0]
            else:
                assigned_to_id = None
        elif assigned_to_id:
            try:
                assigned_to_id = int(assigned_to_id)
            except ValueError:
                assigned_to_id = None

        db.session.execute(
            text(
                "INSERT INTO help_requests (student_id, subject_id, assigned_to, request_type, topic_title, description, priority, status, attachment_url, created_at) "
                "VALUES (:sid, :subid, :assigned, :req_type, :title, :desc, :priority, 'pending', :attach_url, :created)"
            ),
            {
                "sid": user_id,
                "subid": subject_id,
                "assigned": assigned_to_id,
                "req_type": request_type,
                "title": title,
                "desc": description,
                "priority": priority_input,
                "attach_url": attachment_url,
                "created": datetime.utcnow()
            }
        )
        db.session.commit()

        return success_response(message="Help request submitted successfully", status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_REQUEST_ERROR", str(e), status=500)

# ── GET /api/help_requests/mentors ─────────────────────────
# Get list of mentors and their availabilities for the request form dropdown
@bp.route("/mentors", methods=["GET"])
@jwt_required()
def get_available_mentors():
    user_id = int(get_jwt_identity())
    try:
        # Fetch mentors
        mentor_rows = db.session.execute(
            text(
                "SELECT u.id, u.name, mp.rating, u.subject "
                "FROM users u "
                "LEFT JOIN mentor_profiles mp ON u.id = mp.user_id "
                "WHERE u.role = 'mentor' AND u.status = 'active'"
            )
        ).fetchall()

        # Fetch peers (other active students)
        peer_rows = db.session.execute(
            text(
                "SELECT id, name, subject "
                "FROM users "
                "WHERE role = 'student' AND status = 'active' AND id != :uid"
            ),
            {"uid": user_id}
        ).fetchall()

        helpers = []
        
        # 1. Add mentors
        for row in mentor_rows:
            mentor_id = row[0]
            mentor_name = row[1]
            rating = float(row[2]) if row[2] else 4.8
            specialty = row[3] or "Academic"

            # Fetch availability slots
            avail_rows = db.session.execute(
                text(
                    "SELECT dow.name, ma.from_time, ma.until_time "
                    "FROM mentor_availability ma "
                    "JOIN days_of_week dow ON ma.day_id = dow.id "
                    "JOIN mentor_profiles mp ON ma.mentor_id = mp.id "
                    "WHERE mp.user_id = :uid"
                ),
                {"uid": mentor_id}
            ).fetchall()

            if avail_rows:
                # Format: Mon, Wed • 9:00 AM - 12:00 PM
                days = [r[0] for r in avail_rows]
                # Format times
                from_dt = datetime.strptime(str(avail_rows[0][1]), "%H:%M:%S") if len(str(avail_rows[0][1])) > 5 else None
                until_dt = datetime.strptime(str(avail_rows[0][2]), "%H:%M:%S") if len(str(avail_rows[0][2])) > 5 else None
                
                from_str = from_dt.strftime("%I:%M %p").lstrip('0') if from_dt else "10:00 AM"
                until_str = until_dt.strftime("%I:%M %p").lstrip('0') if until_dt else "06:00 PM"
                
                time_str = f"{', '.join(days)} • {from_str}-{until_str}"
            else:
                time_str = "Mon, Wed, Fri • 10:00 AM-06:00 PM"

            helpers.append({
                "id": mentor_id,
                "name": mentor_name,
                "time": time_str,
                "rating": rating,
                "specialty": specialty,
                "initials": "".join([part[0] for part in mentor_name.split()]).upper()[:2],
                # Frontend display string
                "display": f"{mentor_name} ({specialty}) — {time_str}"
            })

        # 2. Add peers (students)
        for row in peer_rows:
            peer_id = row[0]
            peer_name = row[1]
            specialty = row[2] or "Student Peer"
            
            helpers.append({
                "id": peer_id,
                "name": f"Peer: {peer_name}",
                "time": "Online Now",
                "rating": 5.0,
                "specialty": specialty,
                "initials": "".join([part[0] for part in peer_name.split()]).upper()[:2],
                # Frontend display string
                "display": f"Peer: {peer_name} ({specialty}) — Online"
            })

        return success_response(data={"mentors": helpers})
    except Exception as e:
        return error_response("FETCH_MENTORS_ERROR", str(e), status=500)
