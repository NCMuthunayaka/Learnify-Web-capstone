from app.models import Notification
from app.extensions import db

class NotificationService:
    @staticmethod
    def create_notification(user_id, title, message, notification_type="info"):
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            read=False
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    @staticmethod
    def get_user_notifications(user_id):
        """Get all notifications for a user"""
        return Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark a notification as read"""
        notification = Notification.query.get(notification_id)
        if notification:
            notification.read = True
            db.session.commit()
        return notification
    
    @staticmethod
    def delete_notification(notification_id):
        """Delete a notification"""
        notification = Notification.query.get(notification_id)
        if notification:
            db.session.delete(notification)
            db.session.commit()
        return True