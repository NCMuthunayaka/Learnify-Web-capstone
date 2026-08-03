from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": str(e)}}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"success": False, "error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied"}}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Resource not found"}}), 404

    @app.errorhandler(500)
    def internal_error(e):
        err_msg = str(getattr(e, 'original_exception', e))
        return jsonify({"success": False, "error": {"code": "SERVER_ERROR", "message": err_msg}}), 500
