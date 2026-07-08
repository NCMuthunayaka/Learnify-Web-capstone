from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.resource import Resource
from app.models.subject import Subject
from app.models.file_type import FileType
from app.models.user import User
from app.utils.response_utils import success_response, error_response
import os
import uuid
from werkzeug.utils import secure_filename

bp = Blueprint("resources", __name__)

# ── Allowed file types ────────────────────────────────────
ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "mp4"}

EXTENSION_TO_TYPE_ID = {
    "pdf":  1,
    "docx": 2,
    "pptx": 3,
    "mp4":  4,
}

def get_current_role():
    claims = get_jwt()
    return claims.get("role")

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/resources/upload-file ──────────────────────
@bp.route("/upload-file", methods=["POST"])
@jwt_required()
def upload_file():
    try:
        # Check file in request
        if "file" not in request.files:
            return error_response("MISSING_FILE", "No file in request", status=400)

        file = request.files["file"]

        if file.filename == "":
            return error_response("MISSING_FILE", "No file selected", status=400)

        if not allowed_file(file.filename):
            return error_response(
                "INVALID_FILE",
                "Only PDF, DOCX, PPTX, MP4 allowed",
                status=400
            )

        # Get extension and file_type_id
        ext          = file.filename.rsplit(".", 1)[1].lower()
        file_type_id = EXTENSION_TO_TYPE_ID[ext]

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex}.{ext}"

        # Save to uploads folder
        upload_folder = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "uploads"
        )
        os.makedirs(upload_folder, exist_ok=True)

        file_path = os.path.join(upload_folder, unique_name)
        file.save(file_path)

        # Calculate size
        file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)

        file_url = f"/uploads/{unique_name}"

        return success_response(
            data={
                "file_url":     file_url,
                "file_size_mb": file_size_mb,
                "file_type_id": file_type_id,
                "extension":    ext,
            },
            message="File uploaded successfully",
            status=201
        )

    except Exception as e:
        print(f"Upload error: {e}")
        return error_response("UPLOAD_FAILED", str(e), status=500)


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
        data              = r.to_dict()
        subject           = Subject.query.get(r.subject_id)
        file_type         = FileType.query.get(r.file_type_id)
        uploader          = User.query.get(r.uploader_id)
        data["subject_name"]   = subject.name   if subject   else None
        data["file_type_name"] = file_type.name if file_type else None
        data["uploader_name"]  = uploader.name  if uploader  else None
        result.append(data)

    return success_response(data=result)


# ── GET /api/resources/my ─────────────────────────────────
@bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_resources():
    user_id = int(get_jwt_identity())
    role    = get_current_role()

    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can access this", status=403)

    resources = Resource.query.filter_by(
        uploader_id=user_id
    ).order_by(Resource.uploaded_at.desc()).all()

    result = []
    for r in resources:
        data              = r.to_dict()
        subject           = Subject.query.get(r.subject_id)
        file_type         = FileType.query.get(r.file_type_id)
        data["subject_name"]   = subject.name   if subject   else None
        data["file_type_name"] = file_type.name if file_type else None
        result.append(data)

    return success_response(data=result)


# ── GET /api/resources/my/stats ───────────────────────────
@bp.route("/my/stats", methods=["GET"])
@jwt_required()
def get_my_stats():
    user_id = int(get_jwt_identity())
    role    = get_current_role()

    if role not in ["mentor", "admin"]:
        return error_response("FORBIDDEN", "Only mentors can access this", status=403)

    from sqlalchemy import func
    total_uploads   = Resource.query.filter_by(uploader_id=user_id).count()
    total_downloads = db.session.query(
        func.sum(Resource.download_count)
    ).filter_by(uploader_id=user_id).scalar() or 0
    total_views     = db.session.query(
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

    data                   = resource.to_dict()
    subject                = Subject.query.get(resource.subject_id)
    file_type              = FileType.query.get(resource.file_type_id)
    data["subject_name"]   = subject.name   if subject   else None
    data["file_type_name"] = file_type.name if file_type else None

    return success_response(data=data)


# ── POST /api/resources ───────────────────────────────────
@bp.route("", methods=["POST"])
@jwt_required()
def create_resource():
    role    = get_current_role()
    user_id = int(get_jwt_identity())

    # Both students and mentors can upload
    if role not in ["student", "mentor", "admin"]:
        return error_response("FORBIDDEN", "Permission denied", status=403)

    data = request.get_json()
    if not data:
        return error_response("MISSING_DATA", "No data provided", status=400)

    required = ["title", "subject_id", "file_type_id", "file_url"]
    for field in required:
        if not data.get(field):
            return error_response("MISSING_FIELD", f"{field} is required", field, 400)

    uploader      = User.query.get(user_id)
    uploader_type = "peer" if role == "student" else "mentor"

    resource = Resource(
        uploader_id   = user_id,
        uploader_type = uploader_type,
        subject_id    = data["subject_id"],
        file_type_id  = data["file_type_id"],
        title         = data["title"],
        file_url      = data["file_url"],
        file_size_mb  = data.get("file_size_mb", 0),
        status        = "published",
    )

    db.session.add(resource)
    db.session.commit()

    # Notify students about new resource
    try:
        from app.services.notification_service import notify_new_resource
        subject = Subject.query.get(data["subject_id"])
        notify_new_resource(
            resource_title = resource.title,
            subject_name   = subject.name if subject else "General",
            uploader_name  = uploader.name if uploader else "Someone",
        )
    except Exception as e:
        print(f"Notification error: {e}")

    return success_response(
        data=resource.to_dict(),
        message="Resource uploaded successfully",
        status=201,
    )


# ── PATCH /api/resources/<id> ─────────────────────────────
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

    # Delete file from disk if stored locally
    try:
        if resource.file_url and resource.file_url.startswith("/uploads/"):
            filename    = resource.file_url.replace("/uploads/", "")
            upload_folder = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "uploads"
            )
            file_path = os.path.join(upload_folder, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        print(f"File delete error: {e}")

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

    # Build full URL for local files
    file_url = resource.file_url
    if file_url and file_url.startswith("/uploads/"):
        file_url = f"http://localhost:5000{file_url}"

    return success_response(
        data={"file_url": file_url},
        message="Download tracked"
    )