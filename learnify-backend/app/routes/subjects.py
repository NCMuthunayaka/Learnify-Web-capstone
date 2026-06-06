from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.models.subject import Subject
from app.utils.response_utils import success_response, error_response

bp = Blueprint("subjects", __name__)


# ── GET /api/subjects ─────────────────────────────────────
# Returns all subjects from database
# Used by frontend for filters, dropdowns, badges
@bp.route("", methods=["GET"])
@jwt_required()
def get_subjects():
    subjects = Subject.query.all()
    return success_response(data=[s.to_dict() for s in subjects])


# ── GET /api/subjects/<id> ────────────────────────────────
# Returns a single subject by ID
@bp.route("/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_subject(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return error_response("NOT_FOUND", "Subject not found", status=404)
    return success_response(data=subject.to_dict())