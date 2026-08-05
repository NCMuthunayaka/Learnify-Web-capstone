from sqlalchemy import func
from app.models import Feedback, TrackingRecord, Task
from app.extensions import db

class AnalyticsService:
    @staticmethod
    def get_feedback_analytics():
        """Get feedback analytics"""
        total_feedback = Feedback.query.count()
        avg_rating = db.session.query(func.avg(Feedback.rating)).scalar() or 0
        
        rating_distribution = db.session.query(
            Feedback.rating,
            func.count(Feedback.id)
        ).group_by(Feedback.rating).all()
        
        return {
            'total_feedback': total_feedback,
            'average_rating': float(avg_rating),
            'rating_distribution': {str(rating): count for rating, count in rating_distribution}
        }
    
    @staticmethod
    def get_user_tracking_stats(user_id):
        """Get tracking statistics for a user"""
        total_sessions = TrackingRecord.query.filter_by(user_id=user_id).count()
        total_duration = db.session.query(func.sum(TrackingRecord.duration)).filter_by(user_id=user_id).scalar() or 0
        
        return {
            'total_sessions': total_sessions,
            'total_duration': int(total_duration),
            'average_session_duration': int(total_duration / total_sessions) if total_sessions > 0 else 0
        }
    
    @staticmethod
    def get_task_statistics(user_id):
        """Get task statistics for a user"""
        total_tasks = Task.query.filter_by(user_id=user_id).count()
        completed_tasks = Task.query.filter_by(user_id=user_id, status='completed').count()
        pending_tasks = Task.query.filter_by(user_id=user_id, status='pending').count()
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }