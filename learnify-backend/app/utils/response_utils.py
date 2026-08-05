from flask import jsonify


def success_response(data=None, message="Request processed successfully", status=200, pagination=None):
    payload = {"success": True, "message": message, "data": data}
    if pagination:
        payload["pagination"] = pagination
    return jsonify(payload), status


def error_response(code, message, field=None, status=400):
    error = {"code": code, "message": message}
    if field:
        error["field"] = field
    return jsonify({"success": False, "error": error}), status
