from app.extensions import db
from app.models.notification import Notification
from app.models.notification_type import NotificationType


def get_user_notifications(user_id):
    """
    Fetch all notifications for a specific user.
    Returns newest first.
    """
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [n.to_dict() for n in notifications]


def get_unread_count(user_id):
    """
    Count how many unread notifications a user has.
    Used for the bell icon badge number.
    """
    return Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()


def mark_as_read(notification_id, user_id):
    """
    Mark a single notification as read.
    Checks ownership — users can only mark their own notifications.
    Returns the updated notification or None if not found.
    """
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return None

    notification.is_read = True
    db.session.commit()
    return notification


def mark_all_as_read(user_id):
    """
    Mark ALL notifications as read for a user.
    More efficient than marking one by one.
    """
    Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).update({"is_read": True})
    db.session.commit()


def delete_notification(notification_id, user_id):
    """
    Delete a notification.
    Checks ownership — users can only delete their own notifications.
    Returns True if deleted, False if not found.
    """
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return False

    db.session.delete(notification)
    db.session.commit()
    return True


def create_notification(user_id, type_name, title, body, action_url=None):
    """
    Create a new notification for a user.
    type_name must match one of: deadline, mentor_reply,
    resource, achievement, reminder, system, group_invite, result
    """
    # Find the notification type ID from the name
    notification_type = NotificationType.query.filter_by(
        name=type_name
    ).first()

    if not notification_type:
        return None

    notification = Notification(
        user_id    = user_id,
        type_id    = notification_type.id,
        title      = title,
        body       = body,
        action_url = action_url,
    )

    db.session.add(notification)
    db.session.commit()
    return notification