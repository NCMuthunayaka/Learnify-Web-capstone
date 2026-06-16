from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.resource import Resource
from app.models.subject import Subject
from app.models.file_type import FileType
from app.models.user import User
from app.utils.response_utils import success_response, error_response

bp = Blueprint("resources", __name__)


def get_current_role():
    claims = get_jwt()
    return claims.get("role")


# ── GET /api/resources ────────────────────────────────────
@bp.route("", methods=["GET"])
@jwt_required()
def get_resources():
    subject_id   = request.args.get("subject_id",   type=int)
    file_type_id = request.args.get("file_type_id", type=int)
    search       = request.args.get("search",       type=str)

    query = Resource.query.filter_by(status="published")

    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if file_type_id:
        query = query.filter_by(file_type_id=file_type_id)
    if search:
        query = query.filter(Resource.title.ilike(f"%{search}%"))

    resources = query.order_by(Resource.uploaded_at.desc()).all()

    result = []
    for r in resources:
        data          = r.to_dict()
        subject       = Subject.query.get(r.subject_id)
        file_type     = FileType.query.get(r.file_type_id)
        uploader      = User.query.get(r.uploader_id)
        data["subject_name"]   = subject.name   if subject   else None
        data["file_type_name"] = file_type.name if file_type else None
        data["uploader_name"]  = uploader.name  if uploader  else None
        result.append(data)

    return success_response(data=result)


# ── GET /api/resources/my ─────────────────────────────────
# Returns only the logged in mentor's resources
@bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_resources():
    user_id = int(get_jwt_identity())
    role    = get_current_role()

    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can access this", status=403)

    search       = request.args.get("search",       type=str)
    subject_id   = request.args.get("subject_id",   type=int)
    file_type_id = request.args.get("file_type_id", type=int)

    # Filter by current mentor only
    query = Resource.query.filter_by(uploader_id=user_id)

    if search:
        query = query.filter(Resource.title.ilike(f"%{search}%"))
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if file_type_id:
        query = query.filter_by(file_type_id=file_type_id)

    resources = query.order_by(Resource.uploaded_at.desc()).all()

    result = []
    for r in resources:
        data          = r.to_dict()
        subject       = Subject.query.get(r.subject_id)
        file_type     = FileType.query.get(r.file_type_id)
        data["subject_name"]   = subject.name   if subject   else None
        data["file_type_name"] = file_type.name if file_type else None
        result.append(data)

    return success_response(data=result)


# ── GET /api/resources/my/stats ───────────────────────────
# Returns upload stats for mentor dashboard
@bp.route("/my/stats", methods=["GET"])
@jwt_required()
def get_my_stats():
    user_id = int(get_jwt_identity())
    role    = get_current_role()

    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can access this", status=403)

    # Total uploads
    total_uploads = Resource.query.filter_by(uploader_id=user_id).count()

    # Total downloads across all resources
    from sqlalchemy import func
    total_downloads = db.session.query(
        func.sum(Resource.download_count)
    ).filter_by(uploader_id=user_id).scalar() or 0

    # Total views
    total_views = db.session.query(
        func.sum(Resource.view_count)
    ).filter_by(uploader_id=user_id).scalar() or 0

    return success_response(data={
        "total_uploads":   total_uploads,
        "total_downloads": int(total_downloads),
        "total_views":     int(total_views),
    })


# ── GET /api/resources/<id> ───────────────────────────────
@bp.route("/<int:resource_id>", methods=["GET"])
@jwt_required()
def get_resource(resource_id):
    resource = Resource.query.get(resource_id)

    if not resource:
        return error_response("NOT_FOUND", "Resource not found", status=404)

    resource.view_count += 1
    db.session.commit()

    data          = resource.to_dict()
    subject       = Subject.query.get(resource.subject_id)
    file_type     = FileType.query.get(resource.file_type_id)
    data["subject_name"]   = subject.name   if subject   else None
    data["file_type_name"] = file_type.name if file_type else None

    return success_response(data=data)


# ── POST /api/resources ───────────────────────────────────
@bp.route("", methods=["POST"])
@jwt_required()
def create_resource():
    role = get_current_role()
    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can upload resources", status=403)

    data     = request.get_json()
    required = ["title", "subject_id", "file_type_id", "file_url"]

    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    user_id  = int(get_jwt_identity())

    resource = Resource(
        uploader_id  = user_id,
        subject_id   = data["subject_id"],
        file_type_id = data["file_type_id"],
        title        = data["title"],
        file_url     = data["file_url"],
        file_size_mb = data.get("file_size_mb", 0),
        duration_sec = data.get("duration_sec"),
        status       = "published",
    )

    db.session.add(resource)
    db.session.commit()

    return success_response(
        data=resource.to_dict(),
        message="Resource uploaded successfully",
        status=201,
    )


# ── PATCH /api/resources/<id> ─────────────────────────────
# Update a resource — mentor can only update their own
@bp.route("/<int:resource_id>", methods=["PATCH"])
@jwt_required()
def update_resource(resource_id):
    user_id  = int(get_jwt_identity())
    role     = get_current_role()
    resource = Resource.query.get(resource_id)

    if not resource:
        return error_response("NOT_FOUND", "Resource not found", status=404)

    if role == "mentor" and resource.uploader_id != user_id:
        return error_response("FORBIDDEN", "You can only edit your own resources", status=403)

    data           = request.get_json()
    allowed_fields = ["title", "subject_id", "file_type_id",
                      "file_url", "file_size_mb", "status"]

    for field in allowed_fields:
        if field in data:
            setattr(resource, field, data[field])

    db.session.commit()

    return success_response(
        data=resource.to_dict(),
        message="Resource updated successfully"
    )


# ── DELETE /api/resources/<id> ────────────────────────────
@bp.route("/<int:resource_id>", methods=["DELETE"])
@jwt_required()
def delete_resource(resource_id):
    user_id  = int(get_jwt_identity())
    role     = get_current_role()
    resource = Resource.query.get(resource_id)

    if not resource:
        return error_response("NOT_FOUND", "Resource not found", status=404)

    if role == "mentor" and resource.uploader_id != user_id:
        return error_response("FORBIDDEN", "You can only delete your own resources", status=403)

    # ── Delete the actual file from disk ──────────────────
    try:
        from app.services.file_service import delete_file
        delete_file(resource.file_url)
    except Exception as e:
        print(f"File deletion error: {e}")

    db.session.delete(resource)
    db.session.commit()

    return success_response(message="Resource deleted successfully")


# ── POST /api/resources/<id>/download ────────────────────
@bp.route("/<int:resource_id>/download", methods=["POST"])
@jwt_required()
def track_download(resource_id):
    resource = Resource.query.get(resource_id)

    if not resource:
        return error_response("NOT_FOUND", "Resource not found", status=404)

    resource.download_count += 1
    db.session.commit()

    return success_response(
        data={"file_url": resource.file_url},
        message="Download tracked"
    )

# ── POST /api/resources/upload-file ──────────────────────
# Accepts actual file, saves to server, returns file URL
# Called BEFORE creating the resource record
@bp.route("/upload-file", methods=["POST"])
@jwt_required()
def upload_file():
    role = get_current_role()
    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can upload files", status=403)

    # Check if file is in request
    if "file" not in request.files:
        return error_response("MISSING_FILE", "No file provided", status=400)

    file = request.files["file"]

    try:
        from app.services.file_service import save_file, get_file_type_id

        # Save file and get URL + size
        file_url, file_size_mb, ext = save_file(file)
        file_type_id                = get_file_type_id(ext)

        return success_response(
            data={
                "file_url":     file_url,
                "file_size_mb": file_size_mb,
                "file_type_id": file_type_id,
                "extension":    ext,
            },
            message="File uploaded successfully",
            status=201,
        )

    except ValueError as e:
        return error_response("INVALID_FILE", str(e), status=400)
    except Exception as e:
        return error_response("UPLOAD_FAILED", f"Upload failed: {str(e)}", status=500)