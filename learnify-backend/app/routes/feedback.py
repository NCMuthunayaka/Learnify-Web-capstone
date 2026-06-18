from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app.extensions import db
from app.models.feedback import Feedback
from app.models.user import User
from app.services.sentiment_service import analyze_sentiment
from app.utils.response_utils import success_response, error_response

bp = Blueprint("feedback", __name__)


def _user_id():
    return int(get_jwt_identity())


def _role():
    return get_jwt().get("role")


# ── POST /api/feedback ────────────────────────────────────
@bp.route("", methods=["POST"])
@jwt_required()
def submit_feedback():
    data = request.get_json()

    for field in ["subject", "category", "rating", "comment"]:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    rating = int(data["rating"])
    if not (1 <= rating <= 5):
        return error_response("INVALID_RATING", "Rating must be between 1 and 5", status=400)

    try:
        result     = analyze_sentiment(data["comment"])
        sentiment  = result.get("sentiment", "Neutral").lower()
        confidence = result.get("confidence", 0.0)
    except Exception:
        sentiment  = None
        confidence = None

    user_id = _user_id()
    fb = Feedback(
        user_id    = user_id,
        subject    = data["subject"],
        mentor_id  = data.get("mentor_id"),
        rating     = rating,
        category   = data["category"],
        comment    = data["comment"],
        sentiment  = sentiment,
        confidence = confidence,
    )
    db.session.add(fb)
    db.session.commit()

    user = User.query.get(user_id)
    return success_response(
        data    = fb.to_dict(user_name=user.name if user else None),
        message = "Feedback submitted successfully",
        status  = 201,
    )


# ── GET /api/feedback/my ──────────────────────────────────
@bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_feedback():
    user_id = _user_id()
    items   = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.created_at.desc()).all()
    user    = User.query.get(user_id)
    name    = user.name if user else None
    return success_response(data=[fb.to_dict(user_name=name) for fb in items])


# ── GET /api/feedback ─────────────────────────────────────
# Admin: all feedback — Student: own only
@bp.route("", methods=["GET"])
@jwt_required()
def get_feedback():
    role    = _role()
    user_id = _user_id()

    if role == "admin":
        items  = Feedback.query.order_by(Feedback.created_at.desc()).all()
        result = []
        for fb in items:
            u = User.query.get(fb.user_id)
            result.append(fb.to_dict(user_name=u.name if u else None))
        return success_response(data=result)

    items = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.created_at.desc()).all()
    user  = User.query.get(user_id)
    return success_response(data=[fb.to_dict(user_name=user.name if user else None) for fb in items])


# ── GET /api/feedback/stats ───────────────────────────────
@bp.route("/stats", methods=["GET"])
@jwt_required()
def get_feedback_stats():
    if _role() != "admin":
        return error_response("FORBIDDEN", "Admin only", status=403)

    total      = Feedback.query.count()
    avg_rating = db.session.query(func.avg(Feedback.rating)).scalar() or 0
    positive   = Feedback.query.filter_by(sentiment="positive").count()
    neutral    = Feedback.query.filter_by(sentiment="neutral").count()
    negative   = Feedback.query.filter_by(sentiment="negative").count()

    return success_response(data={
        "total":      total,
        "avg_rating": round(float(avg_rating), 2),
        "positive":   positive,
        "neutral":    neutral,
        "negative":   negative,
    })
