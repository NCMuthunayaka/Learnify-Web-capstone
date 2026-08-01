from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import text
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

bp = Blueprint("community", __name__)

# ── Helper: Ensure tables exist dynamically ─────────────────
def ensure_community_tables():
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS public_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                requester_id INT NOT NULL,
                subject_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('open', 'answered') DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS public_replies (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id INT NOT NULL,
                author_id INT NOT NULL,
                body TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_reply_per_request UNIQUE (request_id, author_id)
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS direct_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                recipient_id INT NOT NULL,
                subject VARCHAR(255) NOT NULL,
                initial_message TEXT NOT NULL,
                status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
                origin_public_request_id INT NULL,
                origin_public_reply_id INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS direct_messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id INT NOT NULL,
                sender_id INT NOT NULL,
                body TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME NULL
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS request_attachments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id INT NOT NULL,
                request_type ENUM('public', 'direct') NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size INT NOT NULL,
                uploaded_by INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS public_request_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                user_id INT NOT NULL,
                vote_type ENUM('up', 'down') NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_req_vote (request_id, user_id)
            );
        """))
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS public_reply_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reply_id INT NOT NULL,
                user_id INT NOT NULL,
                vote_type ENUM('up', 'down') NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_rep_vote (reply_id, user_id)
            );
        """))
        db.session.commit()

        try:
            db.session.execute(text("ALTER TABLE public_replies ADD COLUMN is_accepted TINYINT(1) DEFAULT 0"))
            db.session.commit()
        except Exception:
            db.session.rollback()

        # Legacy sync: Migrate past help_requests into Community Hub tables
        try:
            legacy_rows = db.session.execute(text("""
                SELECT id, student_id, subject_id, assigned_to, topic_title, description, status, attachment_url, created_at
                FROM help_requests
            """)).fetchall()

            for hr in legacy_rows:
                hr_id, sid, subid, assigned, title, desc, st, attach_url, created = hr
                if assigned:
                    # Sync to direct_requests
                    existing = db.session.execute(text("""
                        SELECT id FROM direct_requests WHERE sender_id = :sid AND recipient_id = :rid AND subject = :subj LIMIT 1
                    """), {"sid": sid, "rid": assigned, "subj": title}).fetchone()

                    if not existing:
                        st_mapped = 'resolved' if st == 'resolved' else 'in_progress' if st == 'accepted' else 'pending'
                        db.session.execute(text("""
                            INSERT INTO direct_requests (sender_id, recipient_id, subject, initial_message, status, created_at)
                            VALUES (:sid, :rid, :subj, :msg, :st, :created)
                        """), {"sid": sid, "rid": assigned, "subj": title, "msg": desc, "st": st_mapped, "created": created or datetime.utcnow()})
                        db.session.commit()

                        dr_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                        db.session.execute(text("""
                            INSERT INTO direct_messages (request_id, sender_id, body, created_at)
                            VALUES (:tid, :sid, :msg, :created)
                        """), {"tid": dr_id, "sid": sid, "msg": desc, "created": created or datetime.utcnow()})
                        db.session.commit()

                        if attach_url:
                            db.session.execute(text("""
                                INSERT INTO request_attachments (request_id, request_type, file_url, file_name, file_size, uploaded_by, created_at)
                                VALUES (:rid, 'direct', :furl, 'Attachment', 0, :uid, :created)
                            """), {"rid": dr_id, "furl": attach_url, "uid": sid, "created": created or datetime.utcnow()})
                            db.session.commit()
                else:
                    # Sync to public_requests
                    existing = db.session.execute(text("""
                        SELECT id FROM public_requests WHERE requester_id = :sid AND title = :title LIMIT 1
                    """), {"sid": sid, "title": title}).fetchone()

                    if not existing:
                        st_mapped = 'answered' if st == 'resolved' else 'open'
                        db.session.execute(text("""
                            INSERT INTO public_requests (requester_id, subject_id, title, description, status, created_at)
                            VALUES (:uid, :subid, :title, :desc, :st, :created)
                        """), {"uid": sid, "subid": subid or 1, "title": title, "desc": desc, "st": st_mapped, "created": created or datetime.utcnow()})
                        db.session.commit()

                        pr_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                        if attach_url:
                            db.session.execute(text("""
                                INSERT INTO request_attachments (request_id, request_type, file_url, file_name, file_size, uploaded_by, created_at)
                                VALUES (:rid, 'public', :furl, 'Attachment', 0, :uid, :created)
                            """), {"rid": pr_id, "furl": attach_url, "uid": sid, "created": created or datetime.utcnow()})
                            db.session.commit()
        except Exception as sync_legacy_err:
            pass
    except Exception as e:
        db.session.rollback()
        print(f"Community table init error: {e}")

# ── GET /api/community/summary ─────────────────────────────
# Live summary metrics strip (e.g. 3 open requests · 12 answered this week)
@bp.route("/summary", methods=["GET"])
@jwt_required()
def get_community_summary():
    ensure_community_tables()
    try:
        open_count = db.session.execute(
            text("SELECT COUNT(*) FROM public_requests WHERE status = 'open'")
        ).scalar() or 0

        answered_count = db.session.execute(
            text("SELECT COUNT(*) FROM public_requests WHERE status = 'answered'")
        ).scalar() or 0

        total_direct = db.session.execute(
            text("SELECT COUNT(*) FROM direct_requests")
        ).scalar() or 0

        return success_response(data={
            "open_requests": open_count,
            "answered_requests": answered_count,
            "total_direct": total_direct,
            "summary_text": f"{open_count} open requests · {answered_count} answered questions"
        })
    except Exception as e:
        return error_response("SUMMARY_ERROR", str(e), status=500)

# ── PUBLIC FORUM ENDPOINTS ─────────────────────────────────

# GET /api/community/public
@bp.route("/public", methods=["GET"])
@jwt_required()
def get_public_requests():
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    
    subject_id = request.args.get("subject_id", type=int)
    my_requests = request.args.get("my_requests", type=str) # 'true' / 'false'
    status_filter = request.args.get("status", type=str) # 'open', 'answered', 'all'
    search_query = request.args.get("search", type=str, default="").strip()

    try:
        sql = """
            SELECT pr.id, pr.requester_id, u.name AS requester_name, u.role AS requester_role,
                   pr.subject_id, s.name AS subject_name, pr.title, pr.description,
                   pr.status, pr.created_at, s.color_hex
            FROM public_requests pr
            JOIN users u ON pr.requester_id = u.id
            JOIN subjects s ON pr.subject_id = s.id
            WHERE 1=1
        """
        params = {}

        if subject_id:
            sql += " AND pr.subject_id = :sub_id"
            params["sub_id"] = subject_id

        if my_requests and my_requests.lower() == "true":
            sql += " AND pr.requester_id = :uid"
            params["uid"] = user_id

        if status_filter and status_filter.lower() in ["open", "answered"]:
            sql += " AND pr.status = :st"
            params["st"] = status_filter.lower()

        if search_query:
            sql += " AND (pr.title LIKE :q OR s.name LIKE :q OR pr.description LIKE :q)"
            params["q"] = f"%{search_query}%"

        sql += " ORDER BY pr.created_at DESC"

        rows = db.session.execute(text(sql), params).fetchall()

        result = []
        for r in rows:
            req_id = r[0]

            # Fetch replies for this public request
            reply_rows = db.session.execute(text("""
                SELECT prp.id, prp.author_id, u.name, u.role, prp.body, prp.created_at, COALESCE(prp.is_accepted, 0)
                FROM public_replies prp
                JOIN users u ON prp.author_id = u.id
                WHERE prp.request_id = :req_id
                ORDER BY prp.is_accepted DESC, prp.created_at ASC
            """), {"req_id": req_id}).fetchall()

            replies = []
            has_user_replied = False
            for rep in reply_rows:
                if rep[1] == user_id:
                    has_user_replied = True

                # Fetch reply vote counts and user's vote
                reply_vote_counts = db.session.execute(text("""
                    SELECT
                        COALESCE(SUM(CASE WHEN vote_type='up' THEN 1 ELSE 0 END), 0) AS up_votes,
                        COALESCE(SUM(CASE WHEN vote_type='down' THEN 1 ELSE 0 END), 0) AS down_votes
                    FROM public_reply_votes WHERE reply_id = :rep_id
                """), {"rep_id": rep[0]}).fetchone()

                user_reply_vote = db.session.execute(text("""
                    SELECT vote_type FROM public_reply_votes
                    WHERE reply_id = :rep_id AND user_id = :uid
                """), {"rep_id": rep[0], "uid": user_id}).fetchone()

                rep_up = int(reply_vote_counts[0]) if reply_vote_counts else 0
                rep_down = int(reply_vote_counts[1]) if reply_vote_counts else 0

                # Fetch reply attachments
                att_rows = db.session.execute(text("""
                    SELECT id, file_url, file_name, file_size
                    FROM request_attachments
                    WHERE request_id = :req_id AND request_type = 'public' AND uploaded_by = :uid
                """), {"req_id": rep[0], "uid": rep[1]}).fetchall()

                replies.append({
                    "id": rep[0],
                    "author_id": rep[1],
                    "author_name": rep[2],
                    "author_role": rep[3],
                    "body": rep[4],
                    "created_at": rep[5].isoformat() if rep[5] else None,
                    "is_mentor": (rep[3] in ["mentor", "admin"]),
                    "is_accepted": bool(rep[6]),
                    "up_votes": rep_up,
                    "down_votes": rep_down,
                    "vote_score": rep_up - rep_down,
                    "user_vote": user_reply_vote[0] if user_reply_vote else None,
                    "attachments": [{"id": a[0], "file_url": a[1], "file_name": a[2], "file_size": a[3]} for a in att_rows]
                })

            # Fetch question vote counts and user's vote
            q_vote_counts = db.session.execute(text("""
                SELECT
                    COALESCE(SUM(CASE WHEN vote_type='up' THEN 1 ELSE 0 END), 0) AS up_votes,
                    COALESCE(SUM(CASE WHEN vote_type='down' THEN 1 ELSE 0 END), 0) AS down_votes
                FROM public_request_votes WHERE request_id = :req_id
            """), {"req_id": req_id}).fetchone()

            user_q_vote = db.session.execute(text("""
                SELECT vote_type FROM public_request_votes
                WHERE request_id = :req_id AND user_id = :uid
            """), {"req_id": req_id, "uid": user_id}).fetchone()

            q_up = int(q_vote_counts[0]) if q_vote_counts else 0
            q_down = int(q_vote_counts[1]) if q_vote_counts else 0

            # Fetch question attachments
            att_q_rows = db.session.execute(text("""
                SELECT id, file_url, file_name, file_size
                FROM request_attachments
                WHERE request_id = :req_id AND request_type = 'public' AND uploaded_by = :uid
            """), {"req_id": req_id, "uid": r[1]}).fetchall()

            result.append({
                "id": req_id,
                "requester_id": r[1],
                "requester_name": r[2],
                "requester_role": r[3],
                "subject_id": r[4],
                "subject_name": r[5],
                "title": r[6],
                "description": r[7],
                "status": r[8],
                "created_at": r[9].isoformat() if r[9] else None,
                "color_hex": r[10],
                "replies": replies,
                "has_user_replied": has_user_replied,
                "up_votes": q_up,
                "down_votes": q_down,
                "vote_score": q_up - q_down,
                "user_vote": user_q_vote[0] if user_q_vote else None,
                "attachments": [{"id": a[0], "file_url": a[1], "file_name": a[2], "file_size": a[3]} for a in att_q_rows]
            })

        return success_response(data={"requests": result})
    except Exception as e:
        return error_response("FETCH_PUBLIC_REQUESTS_ERROR", str(e), status=500)

# POST /api/community/public
@bp.route("/public", methods=["POST"])
@jwt_required()
def create_public_request():
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    subject_id = data.get("subject_id")
    attachments = data.get("attachments") or [] # List of {file_url, file_name, file_size}

    if not title or not description or not subject_id:
        return error_response("MISSING_FIELD", "Title, description, and subject are required", status=400)

    try:
        db.session.execute(text("""
            INSERT INTO public_requests (requester_id, subject_id, title, description, status, created_at)
            VALUES (:uid, :subid, :title, :desc, 'open', :now)
        """), {"uid": user_id, "subid": subject_id, "title": title, "desc": description, "now": datetime.utcnow()})
        db.session.commit()

        req_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Insert attachments if provided
        for att in attachments:
            db.session.execute(text("""
                INSERT INTO request_attachments (request_id, request_type, file_url, file_name, file_size, uploaded_by, created_at)
                VALUES (:rid, 'public', :furl, :fname, :fsize, :uid, :now)
            """), {
                "rid": req_id,
                "furl": att.get("file_url"),
                "fname": att.get("file_name", "Attachment"),
                "fsize": att.get("file_size", 0),
                "uid": user_id,
                "now": datetime.utcnow()
            })
        db.session.commit()

        return success_response(message="Public question posted successfully", data={"request_id": req_id}, status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_PUBLIC_REQUEST_ERROR", str(e), status=500)

# POST /api/community/public/<id>/reply
@bp.route("/public/<int:request_id>/reply", methods=["POST"])
@jwt_required()
def create_public_reply(request_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    attachments = data.get("attachments") or []

    if not body:
        return error_response("MISSING_FIELD", "Reply text is required", status=400)

    try:
        # Check if user already replied (Enforces 1 reply per user constraint)
        existing = db.session.execute(text("""
            SELECT id FROM public_replies WHERE request_id = :rid AND author_id = :uid LIMIT 1
        """), {"rid": request_id, "uid": user_id}).fetchone()

        if existing:
            return error_response("ONE_REPLY_LIMIT", "You have already posted a reply to this question. Other community members can submit their own replies.", status=400)

        # Insert reply
        db.session.execute(text("""
            INSERT INTO public_replies (request_id, author_id, body, created_at)
            VALUES (:rid, :uid, :body, :now)
        """), {"rid": request_id, "uid": user_id, "body": body, "now": datetime.utcnow()})
        
        # Auto update request status to answered
        db.session.execute(text("""
            UPDATE public_requests SET status = 'answered' WHERE id = :rid
        """), {"rid": request_id})

        db.session.commit()

        reply_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Insert attachments if any
        for att in attachments:
            db.session.execute(text("""
                INSERT INTO request_attachments (request_id, request_type, file_url, file_name, file_size, uploaded_by, created_at)
                VALUES (:rid, 'public', :furl, :fname, :fsize, :uid, :now)
            """), {
                "rid": reply_id,
                "furl": att.get("file_url"),
                "fname": att.get("file_name", "Attachment"),
                "fsize": att.get("file_size", 0),
                "uid": user_id,
                "now": datetime.utcnow()
            })
        db.session.commit()

        return success_response(message="Reply posted successfully", data={"reply_id": reply_id}, status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_PUBLIC_REPLY_ERROR", str(e), status=500)


# POST /api/community/public/<id>/reply/<reply_id>/accept
@bp.route("/public/<int:request_id>/reply/<int:reply_id>/accept", methods=["POST"])
@jwt_required()
def accept_public_reply(request_id, reply_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())

    try:
        # Check if current user is the owner of the question
        req = db.session.execute(
            text("SELECT requester_id FROM public_requests WHERE id = :rid"),
            {"rid": request_id}
        ).fetchone()

        if not req:
            return error_response("NOT_FOUND", "Question not found", status=404)

        if req[0] != user_id:
            return error_response("FORBIDDEN", "Only the owner of this question can mark an answer as accepted.", status=403)

        # Check if reply exists
        reply = db.session.execute(
            text("SELECT author_id FROM public_replies WHERE id = :repid AND request_id = :rid"),
            {"repid": reply_id, "rid": request_id}
        ).fetchone()

        if not reply:
            return error_response("NOT_FOUND", "Reply not found", status=404)

        reply_author_id = reply[0]

        # Reset any previous accepted reply for this request
        db.session.execute(
            text("UPDATE public_replies SET is_accepted = 0 WHERE request_id = :rid"),
            {"rid": request_id}
        )

        # Set this reply as accepted
        db.session.execute(
            text("UPDATE public_replies SET is_accepted = 1 WHERE id = :repid"),
            {"repid": reply_id}
        )

        # Update question status to answered
        db.session.execute(
            text("UPDATE public_requests SET status = 'answered' WHERE id = :rid"),
            {"rid": request_id}
        )

        # Award +10 points to the author of the accepted answer
        try:
            db.session.execute(
                text("UPDATE student_profiles SET total_points = total_points + 10 WHERE user_id = :uid"),
                {"uid": reply_author_id}
            )
        except Exception:
            pass

        db.session.commit()
        return success_response(message="Answer accepted successfully! +10 Points awarded to helper.")
    except Exception as e:
        db.session.rollback()
        return error_response("ACCEPT_REPLY_ERROR", str(e), status=500)

# ── DIRECT REQUESTS ENDPOINTS (1-on-1 PRIVATE MESSAGING) ──

# GET /api/community/direct
@bp.route("/direct", methods=["GET"])
@jwt_required()
def get_direct_requests():
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get("role", "student")

    tab = request.args.get("tab", type=str, default="inbox" if role in ["mentor", "admin"] else "sent")

    try:
        if tab == "inbox" and role in ["mentor", "admin"]:
            sql = """
                SELECT dr.id, dr.sender_id, u.name AS other_name, u.role AS other_role,
                       dr.subject, dr.initial_message, dr.status, dr.created_at,
                       (SELECT COUNT(*) FROM direct_messages dm WHERE dm.request_id = dr.id AND dm.sender_id != :uid AND dm.read_at IS NULL) AS unread_count
                FROM direct_requests dr
                JOIN users u ON dr.sender_id = u.id
                WHERE dr.recipient_id = :uid
                ORDER BY dr.created_at DESC
            """
        else:
            # Sent tab
            sql = """
                SELECT dr.id, dr.recipient_id, u.name AS other_name, u.role AS other_role,
                       dr.subject, dr.initial_message, dr.status, dr.created_at,
                       0 AS unread_count
                FROM direct_requests dr
                JOIN users u ON dr.recipient_id = u.id
                WHERE dr.sender_id = :uid
                ORDER BY dr.created_at DESC
            """

        rows = db.session.execute(text(sql), {"uid": user_id}).fetchall()

        threads = []
        for r in rows:
            threads.append({
                "id": r[0],
                "other_user_id": r[1],
                "other_user_name": r[2],
                "other_user_role": r[3],
                "subject": r[4],
                "initial_message": r[5],
                "status": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "unread_count": r[8]
            })

        return success_response(data={"threads": threads})
    except Exception as e:
        return error_response("FETCH_DIRECT_REQUESTS_ERROR", str(e), status=500)

# POST /api/community/direct (Create Direct Request)
@bp.route("/direct", methods=["POST"])
@jwt_required()
def create_direct_request():
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    sender_role = claims.get("role", "student")

    data = request.get_json(silent=True) or {}
    recipient_id = data.get("recipient_id")
    subject_text = (data.get("subject") or "").strip()
    initial_message = (data.get("initial_message") or "").strip()
    origin_public_request_id = data.get("origin_public_request_id")
    origin_public_reply_id = data.get("origin_public_reply_id")

    if not recipient_id or not subject_text or not initial_message:
        return error_response("MISSING_FIELD", "Recipient, subject, and initial message are required", status=400)

    try:
        # Verify Recipient Role
        rec_row = db.session.execute(text("SELECT role, name FROM users WHERE id = :id"), {"id": recipient_id}).fetchone()
        if not rec_row:
            return error_response("NOT_FOUND", "Recipient user not found", status=404)

        rec_role = rec_row[0]

        # Enforce Participant Rules:
        # Student -> Mentor: Allowed
        # Mentor -> Mentor: Allowed
        # Student -> Student: FORBIDDEN
        if sender_role == "student" and rec_role == "student":
            return error_response("FORBIDDEN_PARTICIPANT", "Direct student-to-student requests are not supported. Please message a mentor.", status=403)

        db.session.execute(text("""
            INSERT INTO direct_requests (sender_id, recipient_id, subject, initial_message, status, origin_public_request_id, origin_public_reply_id, created_at)
            VALUES (:sid, :rid, :subj, :msg, 'pending', :oprid, :oprep, :now)
        """), {
            "sid": user_id,
            "rid": recipient_id,
            "subj": subject_text,
            "msg": initial_message,
            "oprid": origin_public_request_id,
            "oprep": origin_public_reply_id,
            "now": datetime.utcnow()
        })
        db.session.commit()

        thread_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Insert initial message into direct_messages
        db.session.execute(text("""
            INSERT INTO direct_messages (request_id, sender_id, body, created_at)
            VALUES (:tid, :sid, :msg, :now)
        """), {"tid": thread_id, "sid": user_id, "msg": initial_message, "now": datetime.utcnow()})
        db.session.commit()

        # Notify recipient
        try:
            from app.models.user import User
            sender_obj = User.query.get(user_id)
            sender_name = sender_obj.name if sender_obj else "User"
            from app.services.notification_service import create_notification
            create_notification(
                user_id=recipient_id,
                type_name="system",
                title="New Direct Request",
                body=f"{sender_name} sent you a direct request: '{subject_text}'",
                action_url="/community"
            )
        except Exception as notif_err:
            print(f"Error creating notification: {notif_err}")

        return success_response(message="Direct request started successfully", data={"thread_id": thread_id}, status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_DIRECT_REQUEST_ERROR", str(e), status=500)

# GET /api/community/direct/<id> (Get Thread Messages & Mark Read)
@bp.route("/direct/<int:thread_id>", methods=["GET"])
@jwt_required()
def get_direct_thread(thread_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())

    try:
        thread_row = db.session.execute(text("""
            SELECT dr.id, dr.sender_id, su.name AS sender_name, dr.recipient_id, ru.name AS recipient_name,
                   dr.subject, dr.initial_message, dr.status, dr.created_at,
                   dr.origin_public_request_id, dr.origin_public_reply_id
            FROM direct_requests dr
            JOIN users su ON dr.sender_id = su.id
            JOIN users ru ON dr.recipient_id = ru.id
            WHERE dr.id = :tid
        """), {"tid": thread_id}).fetchone()

        if not thread_row:
            return error_response("NOT_FOUND", "Direct request thread not found", status=404)

        if user_id != thread_row[1] and user_id != thread_row[3]:
            return error_response("FORBIDDEN", "Permission denied to view this thread", status=403)

        # Mark unread messages as read for this user
        db.session.execute(text("""
            UPDATE direct_messages SET read_at = :now
            WHERE request_id = :tid AND sender_id != :uid AND read_at IS NULL
        """), {"tid": thread_id, "uid": user_id, "now": datetime.utcnow()})
        db.session.commit()

        # Fetch all messages in thread
        msg_rows = db.session.execute(text("""
            SELECT dm.id, dm.sender_id, u.name, u.role, dm.body, dm.created_at, dm.read_at
            FROM direct_messages dm
            JOIN users u ON dm.sender_id = u.id
            WHERE dm.request_id = :tid
            ORDER BY dm.created_at ASC
        """), {"tid": thread_id}).fetchall()

        messages = []
        for m in msg_rows:
            # Fetch message attachments
            att_rows = db.session.execute(text("""
                SELECT id, file_url, file_name, file_size
                FROM request_attachments
                WHERE request_id = :msg_id AND request_type = 'direct' AND uploaded_by = :uid
            """), {"msg_id": m[0], "uid": m[1]}).fetchall()

            messages.append({
                "id": m[0],
                "sender_id": m[1],
                "sender_name": m[2],
                "sender_role": m[3],
                "body": m[4],
                "created_at": m[5].isoformat() if m[5] else None,
                "read_at": m[6].isoformat() if m[6] else None,
                "attachments": [{"id": a[0], "file_url": a[1], "file_name": a[2], "file_size": a[3]} for a in att_rows]
            })

        return success_response(data={
            "thread": {
                "id": thread_row[0],
                "sender_id": thread_row[1],
                "sender_name": thread_row[2],
                "recipient_id": thread_row[3],
                "recipient_name": thread_row[4],
                "subject": thread_row[5],
                "initial_message": thread_row[6],
                "status": thread_row[7],
                "created_at": thread_row[8].isoformat() if thread_row[8] else None,
                "origin_public_request_id": thread_row[9],
                "origin_public_reply_id": thread_row[10]
            },
            "messages": messages
        })
    except Exception as e:
        return error_response("FETCH_DIRECT_THREAD_ERROR", str(e), status=500)

# POST /api/community/direct/<id>/messages (Send 1-on-1 Message)
@bp.route("/direct/<int:thread_id>/messages", methods=["POST"])
@jwt_required()
def send_direct_message(thread_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    attachments = data.get("attachments") or []

    if not body:
        return error_response("MISSING_FIELD", "Message body is required", status=400)

    try:
        thread_row = db.session.execute(text("""
            SELECT sender_id, recipient_id, subject FROM direct_requests WHERE id = :tid
        """), {"tid": thread_id}).fetchone()

        if not thread_row:
            return error_response("NOT_FOUND", "Direct request thread not found", status=404)

        if user_id != thread_row[0] and user_id != thread_row[1]:
            return error_response("FORBIDDEN", "Permission denied", status=403)

        # Insert message
        db.session.execute(text("""
            INSERT INTO direct_messages (request_id, sender_id, body, created_at)
            VALUES (:tid, :uid, :body, :now)
        """), {"tid": thread_id, "uid": user_id, "body": body, "now": datetime.utcnow()})

        # Update status to in_progress if pending
        db.session.execute(text("""
            UPDATE direct_requests SET status = 'in_progress' WHERE id = :tid AND status = 'pending'
        """), {"tid": thread_id})

        db.session.commit()

        msg_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Save attachments if any
        for att in attachments:
            db.session.execute(text("""
                INSERT INTO request_attachments (request_id, request_type, file_url, file_name, file_size, uploaded_by, created_at)
                VALUES (:mid, 'direct', :furl, :fname, :fsize, :uid, :now)
            """), {
                "mid": msg_id,
                "furl": att.get("file_url"),
                "fname": att.get("file_name", "Attachment"),
                "fsize": att.get("file_size", 0),
                "uid": user_id,
                "now": datetime.utcnow()
            })
        db.session.commit()

        # Send notification to recipient
        recipient_id = thread_row[1] if user_id == thread_row[0] else thread_row[0]
        try:
            from app.models.user import User
            sender_obj = User.query.get(user_id)
            sender_name = sender_obj.name if sender_obj else "User"
            from app.services.notification_service import create_notification
            create_notification(
                user_id=recipient_id,
                type_name="system",
                title="New Direct Message",
                body=f"{sender_name}: '{body[:50]}...'",
                action_url="/community"
            )
        except Exception as notif_err:
            print(f"Error creating notification: {notif_err}")

        return success_response(message="Message sent successfully", data={"message_id": msg_id}, status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("SEND_DIRECT_MESSAGE_ERROR", str(e), status=500)

# POST /api/community/direct/escalate ("Continue Privately")
@bp.route("/direct/escalate", methods=["POST"])
@jwt_required()
def escalate_to_direct():
    ensure_community_tables()
    user_id = int(get_jwt_identity()) # The mentor responding
    claims = get_jwt()
    mentor_role = claims.get("role", "student")

    if mentor_role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can escalate to private direct requests", status=403)

    data = request.get_json(silent=True) or {}
    public_request_id = data.get("public_request_id")
    public_reply_id = data.get("public_reply_id")

    if not public_request_id:
        return error_response("MISSING_FIELD", "public_request_id is required", status=400)

    try:
        # Fetch public question and requester ID
        pub_row = db.session.execute(text("""
            SELECT requester_id, title, description FROM public_requests WHERE id = :prid
        """), {"prid": public_request_id}).fetchone()

        if not pub_row:
            return error_response("NOT_FOUND", "Public request not found", status=404)

        student_id = pub_row[0]
        pub_title = pub_row[1]

        # Check if direct request already exists between student and this mentor for this public request
        existing_dr = db.session.execute(text("""
            SELECT id FROM direct_requests
            WHERE origin_public_request_id = :prid AND ((sender_id = :mid AND recipient_id = :sid) OR (sender_id = :sid AND recipient_id = :mid))
            LIMIT 1
        """), {"prid": public_request_id, "mid": user_id, "sid": student_id}).fetchone()

        if existing_dr:
            return success_response(message="Direct thread already exists", data={"thread_id": existing_dr[0]})

        # Create new direct request thread from mentor to student
        subj_text = f"Private Discussion: {pub_title}"
        init_msg = f"Hi! Let's continue discussing your question '{pub_title}' privately."

        db.session.execute(text("""
            INSERT INTO direct_requests (sender_id, recipient_id, subject, initial_message, status, origin_public_request_id, origin_public_reply_id, created_at)
            VALUES (:mid, :sid, :subj, :msg, 'in_progress', :prid, :prepid, :now)
        """), {
            "mid": user_id,
            "sid": student_id,
            "subj": subj_text,
            "msg": init_msg,
            "prid": public_request_id,
            "prepid": public_reply_id,
            "now": datetime.utcnow()
        })
        db.session.commit()

        thread_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Insert initial message
        db.session.execute(text("""
            INSERT INTO direct_messages (request_id, sender_id, body, created_at)
            VALUES (:tid, :mid, :msg, :now)
        """), {"tid": thread_id, "mid": user_id, "msg": init_msg, "now": datetime.utcnow()})
        db.session.commit()

        return success_response(message="Private discussion thread opened successfully", data={"thread_id": thread_id}, status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("ESCALATE_ERROR", str(e), status=500)


# ── VOTING ENDPOINTS ────────────────────────────────────────

# POST /api/community/public/<id>/vote
# Vote on a public question (up/down). Re-voting same type removes the vote.
@bp.route("/public/<int:request_id>/vote", methods=["POST"])
@jwt_required()
def vote_public_request(request_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    vote_type = data.get("vote_type")  # 'up' or 'down'

    if vote_type not in ["up", "down"]:
        return error_response("INVALID_VOTE", "vote_type must be 'up' or 'down'", status=400)

    try:
        # Check if question exists
        q = db.session.execute(
            text("SELECT id FROM public_requests WHERE id = :rid"),
            {"rid": request_id}
        ).fetchone()
        if not q:
            return error_response("NOT_FOUND", "Question not found", status=404)

        # Check existing vote
        existing = db.session.execute(text("""
            SELECT id, vote_type FROM public_request_votes
            WHERE request_id = :rid AND user_id = :uid
        """), {"rid": request_id, "uid": user_id}).fetchone()

        if existing:
            if existing[1] == vote_type:
                # Same vote — toggle off (remove)
                db.session.execute(text("""
                    DELETE FROM public_request_votes WHERE id = :vid
                """), {"vid": existing[0]})
                db.session.commit()
                return success_response(message="Vote removed")
            else:
                # Different vote — switch
                db.session.execute(text("""
                    UPDATE public_request_votes SET vote_type = :vt WHERE id = :vid
                """), {"vt": vote_type, "vid": existing[0]})
                db.session.commit()
                return success_response(message="Vote updated")
        else:
            # New vote
            db.session.execute(text("""
                INSERT INTO public_request_votes (request_id, user_id, vote_type, created_at)
                VALUES (:rid, :uid, :vt, :now)
            """), {"rid": request_id, "uid": user_id, "vt": vote_type, "now": datetime.utcnow()})
            db.session.commit()
            return success_response(message="Vote recorded", status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("VOTE_ERROR", str(e), status=500)


# POST /api/community/public/<id>/reply/<reply_id>/vote
# Vote on a public reply/answer (up/down). Re-voting same type removes the vote.
@bp.route("/public/<int:request_id>/reply/<int:reply_id>/vote", methods=["POST"])
@jwt_required()
def vote_public_reply(request_id, reply_id):
    ensure_community_tables()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    vote_type = data.get("vote_type")  # 'up' or 'down'

    if vote_type not in ["up", "down"]:
        return error_response("INVALID_VOTE", "vote_type must be 'up' or 'down'", status=400)

    try:
        # Check reply exists and belongs to the right question
        rep = db.session.execute(
            text("SELECT id FROM public_replies WHERE id = :repid AND request_id = :rid"),
            {"repid": reply_id, "rid": request_id}
        ).fetchone()
        if not rep:
            return error_response("NOT_FOUND", "Reply not found", status=404)

        # Check existing vote
        existing = db.session.execute(text("""
            SELECT id, vote_type FROM public_reply_votes
            WHERE reply_id = :repid AND user_id = :uid
        """), {"repid": reply_id, "uid": user_id}).fetchone()

        if existing:
            if existing[1] == vote_type:
                # Same vote — toggle off (remove)
                db.session.execute(text("""
                    DELETE FROM public_reply_votes WHERE id = :vid
                """), {"vid": existing[0]})
                db.session.commit()
                return success_response(message="Vote removed")
            else:
                # Different vote — switch
                db.session.execute(text("""
                    UPDATE public_reply_votes SET vote_type = :vt WHERE id = :vid
                """), {"vt": vote_type, "vid": existing[0]})
                db.session.commit()
                return success_response(message="Vote updated")
        else:
            # New vote
            db.session.execute(text("""
                INSERT INTO public_reply_votes (reply_id, user_id, vote_type, created_at)
                VALUES (:repid, :uid, :vt, :now)
            """), {"repid": reply_id, "uid": user_id, "vt": vote_type, "now": datetime.utcnow()})
            db.session.commit()
            return success_response(message="Vote recorded", status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("VOTE_REPLY_ERROR", str(e), status=500)
