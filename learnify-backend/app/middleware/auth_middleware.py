from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps

def token_required(fn):
    """Decorator to require JWT token"""
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            return fn(current_user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401
    return decorated_function

def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            # TODO: Check user role from database
            return fn(current_user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Forbidden', 'message': str(e)}), 403
    return decorated_function