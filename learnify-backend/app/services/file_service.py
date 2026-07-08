import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# Allowed extensions map
ALLOWED_EXTENSIONS = {
    "pdf":  1,  # file_type_id from DB
    "docx": 2,
    "pptx": 3,
    "mp4":  4,
}


def allowed_file(filename):
    """
    Check if the file extension is allowed
    Returns the extension if allowed, None if not
    """
    if "." not in filename:
        return None

    ext = filename.rsplit(".", 1)[1].lower()
    if ext in ALLOWED_EXTENSIONS:
        return ext
    return None


def get_file_type_id(extension):
    """
    Returns the file_type_id based on extension
    Matches the file_types table in DB
    """
    return ALLOWED_EXTENSIONS.get(extension.lower())


def save_file(file):
    """
    Saves an uploaded file to the uploads folder
    Returns (file_url, file_size_mb, extension) or raises Exception
    """
    if not file or file.filename == "":
        raise ValueError("No file provided")

    # Check extension
    ext = allowed_file(file.filename)
    if not ext:
        raise ValueError("File type not allowed. Use PDF, DOCX, PPTX, or MP4")

    # Generate unique filename to avoid conflicts
    # e.g. "Organic Chemistry Notes.pdf" → "a3f2b1c4.pdf"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename   = secure_filename(unique_filename)

    # Make sure uploads folder exists
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    # Save file to disk
    file_path = os.path.join(upload_folder, safe_filename)
    file.save(file_path)

    # Calculate file size in MB
    file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)

    # Return the URL path that frontend will use to access the file
    file_url = f"/uploads/{safe_filename}"

    return file_url, file_size_mb, ext


def delete_file(file_url):
    """
    Deletes a file from the uploads folder
    Called when a resource is deleted
    """
    if not file_url or not file_url.startswith("/uploads/"):
        return  # External URL — don't try to delete

    try:
        filename    = file_url.replace("/uploads/", "")
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        file_path   = os.path.join(upload_folder, filename)

        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"File delete error: {e}")