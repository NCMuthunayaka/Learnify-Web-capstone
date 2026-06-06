from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import (
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    delete_notification,
    create_notification,
)
from app.utils.response_utils import success_response, error_response

bp = Blueprint("notifications", __name__)


# ── GET /api/notifications ────────────────────────────────
# Get all notifications for the logged in user
# Also returns unread count for the bell badge
@bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    # Get current user ID from JWT token
    user_id = int(get_jwt_identity())

    # Get all notifications for this user
    notifications = get_user_notifications(user_id)

    # Get unread count for bell icon badge
    unread_count  = get_unread_count(user_id)

    return success_response(data={
        "notifications": notifications,
        "unread_count":  unread_count,
    })


# ── PATCH /api/notifications/read-all ────────────────────
# Mark ALL notifications as read
# Must be defined BEFORE /<id>/read to avoid route conflict
@bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def read_all_notifications():
    user_id = int(get_jwt_identity())

    mark_all_as_read(user_id)

    return success_response(message="All notifications marked as read")


# ── PATCH /api/notifications/<id>/read ───────────────────
# Mark a single notification as read
# User can only mark their own notifications
@bp.route("/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def read_notification(notification_id):
    user_id = int(get_jwt_identity())

    notification = mark_as_read(notification_id, user_id)

    if not notification:
        return error_response(
            "NOT_FOUND",
            "Notification not found",
            status=404
        )

    return success_response(
        data=notification.to_dict(),
        message="Notification marked as read"
    )


# ── DELETE /api/notifications/<id> ───────────────────────
# Delete a notification
# User can only delete their own notifications
@bp.route("/<int:notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification_route(notification_id):
    user_id = int(get_jwt_identity())

    deleted = delete_notification(notification_id, user_id)

    if not deleted:
        return error_response(
            "NOT_FOUND",
            "Notification not found",
            status=404
        )

    return success_response(message="Notification deleted")


# ── POST /api/notifications/test ─────────────────────────
# Create a test notification — useful for development only
# Remove this route before going to production
@bp.route("/test", methods=["POST"])
@jwt_required()
def create_test_notification():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    notification = create_notification(
        user_id    = user_id,
        type_name  = data.get("type",       "system"),
        title      = data.get("title",      "Test Notification"),
        body       = data.get("body",       "This is a test"),
        action_url = data.get("action_url"),
    )

    if not notification:
        return error_response(
            "INVALID_TYPE",
            "Invalid notification type",
            status=400
        )

    return success_response(
        data=notification.to_dict(),
        message="Test notification created",
        status=201
    )