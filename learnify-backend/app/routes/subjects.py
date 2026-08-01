from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.subject import Subject
from app.utils.response_utils import success_response, error_response

bp = Blueprint("subjects", __name__)


# ── GET /api/subjects ─────────────────────────────────────
@bp.route("", methods=["GET"])
@jwt_required()
def get_subjects():
    subjects = Subject.query.order_by(Subject.name.asc()).all()
    return success_response(data=[s.to_dict() for s in subjects])


# ── POST /api/subjects ────────────────────────────────────
# Create a new course subject
@bp.route("", methods=["POST"])
@jwt_required()
def create_subject():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    color_hex = data.get("color_hex", "#3b719f")

    if not name:
        return error_response("MISSING_FIELD", "Subject name is required", status=400)

    # Check if subject already exists
    existing = Subject.query.filter(Subject.name.ilike(name)).first()
    if existing:
        return success_response(data=existing.to_dict(), message="Subject already exists", status=200)

    try:
        new_subject = Subject(name=name, color_hex=color_hex)
        db.session.add(new_subject)
        db.session.commit()

        return success_response(data=new_subject.to_dict(), message="Subject created successfully", status=201)
    except Exception as e:
        db.session.rollback()
        return error_response("CREATE_SUBJECT_ERROR", str(e), status=500)


# ── GET /api/subjects/<id> ────────────────────────────────
@bp.route("/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_subject(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return error_response("NOT_FOUND", "Subject not found", status=404)
    return success_response(data=subject.to_dict())