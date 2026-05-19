from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.feedback import Feedback
from app.models.user import User
from app.extensions import db
from app.services.sentiment_service import SentimentService
from app.utils.response_utils import success_response, error_response
from datetime import datetime

bp = Blueprint("feedback", __name__)


@bp.route("", methods=["POST"])
@jwt_required()
def create_feedback():
    """
    Create new feedback with sentiment analysis.
    
    Request body:
    {
        "category": "bug|feature|improvement|other",
        "title": "Feedback title",
        "content": "Detailed feedback content",
        "rating": 1-5
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        required_fields = ["category", "title", "content", "rating"]
        if not all(field in data for field in required_fields):
            return error_response("Missing required fields", 400)

        # Validate rating
        rating = int(data.get("rating", 0))
        if rating < 1 or rating > 5:
            return error_response("Rating must be between 1 and 5", 400)

        # Validate category
        valid_categories = ["bug", "feature", "improvement", "other"]
        if data["category"] not in valid_categories:
            return error_response(f"Category must be one of {valid_categories}", 400)

        # Analyze sentiment
        sentiment_result = SentimentService.analyze_sentiment(data["content"])
        
        # Create feedback
        feedback = Feedback(
            user_id=user_id,
            category=data["category"],
            title=data["title"],
            content=data["content"],
            rating=rating,
            sentiment=sentiment_result.get("sentiment", "neutral"),
            sentiment_score=sentiment_result.get("confidence", 0.0),
        )

        db.session.add(feedback)
        db.session.commit()

        return success_response({
            "message": "Feedback submitted successfully",
            "feedback": feedback.to_dict()
        }, 201)

    except ValueError as e:
        return error_response(f"Invalid data: {str(e)}", 400)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error creating feedback: {str(e)}", 500)


@bp.route("", methods=["GET"])
@jwt_required()
def get_user_feedback():
    """
    Get all feedback from current user.
    Query params:
    - category: Filter by category
    - sentiment: Filter by sentiment
    """
    try:
        user_id = get_jwt_identity()
        category = request.args.get("category")
        sentiment = request.args.get("sentiment")

        query = Feedback.query.filter_by(user_id=user_id)

        if category:
            query = query.filter_by(category=category)

        if sentiment:
            query = query.filter_by(sentiment=sentiment)

        feedbacks = query.order_by(Feedback.created_at.desc()).all()

        return success_response({
            "count": len(feedbacks),
            "feedbacks": [f.to_dict() for f in feedbacks]
        })

    except Exception as e:
        return error_response(f"Error fetching feedback: {str(e)}", 500)


@bp.route("/<int:feedback_id>", methods=["GET"])
@jwt_required()
def get_feedback_detail(feedback_id):
    """Get detailed feedback by ID."""
    try:
        feedback = Feedback.query.get(feedback_id)

        if not feedback:
            return error_response("Feedback not found", 404)

        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Only user or admin can view feedback
        if feedback.user_id != user_id and user.role != "admin":
            return error_response("Unauthorized", 403)

        return success_response({"feedback": feedback.to_dict()})

    except Exception as e:
        return error_response(f"Error fetching feedback: {str(e)}", 500)


@bp.route("/<int:feedback_id>", methods=["PUT"])
@jwt_required()
def update_feedback(feedback_id):
    """
    Update feedback.
    Only the feedback owner can update.
    """
    try:
        user_id = get_jwt_identity()
        feedback = Feedback.query.get(feedback_id)

        if not feedback:
            return error_response("Feedback not found", 404)

        if feedback.user_id != user_id:
            return error_response("Unauthorized", 403)

        data = request.get_json()

        # Update fields
        if "title" in data:
            feedback.title = data["title"]
        if "content" in data:
            feedback.content = data["content"]
            # Re-analyze sentiment if content changed
            sentiment_result = SentimentService.analyze_sentiment(data["content"])
            feedback.sentiment = sentiment_result.get("sentiment", "neutral")
            feedback.sentiment_score = sentiment_result.get("confidence", 0.0)
        if "rating" in data:
            rating = int(data["rating"])
            if 1 <= rating <= 5:
                feedback.rating = rating
        if "category" in data:
            valid_categories = ["bug", "feature", "improvement", "other"]
            if data["category"] in valid_categories:
                feedback.category = data["category"]

        feedback.updated_at = datetime.utcnow()
        db.session.commit()

        return success_response({
            "message": "Feedback updated successfully",
            "feedback": feedback.to_dict()
        })

    except ValueError as e:
        return error_response(f"Invalid data: {str(e)}", 400)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error updating feedback: {str(e)}", 500)


@bp.route("/<int:feedback_id>", methods=["DELETE"])
@jwt_required()
def delete_feedback(feedback_id):
    """
    Delete feedback.
    Only the feedback owner can delete.
    """
    try:
        user_id = get_jwt_identity()
        feedback = Feedback.query.get(feedback_id)

        if not feedback:
            return error_response("Feedback not found", 404)

        if feedback.user_id != user_id:
            return error_response("Unauthorized", 403)

        db.session.delete(feedback)
        db.session.commit()

        return success_response({"message": "Feedback deleted successfully"})

    except Exception as e:
        db.session.rollback()
        return error_response(f"Error deleting feedback: {str(e)}", 500)


@bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_feedback():
    """
    Get all feedback (admin only).
    Query params:
    - category: Filter by category
    - sentiment: Filter by sentiment
    - limit: Limit results (default 50)
    - offset: Offset for pagination (default 0)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check if user is admin
        if not user or user.role != "admin":
            return error_response("Admin access required", 403)

        category = request.args.get("category")
        sentiment = request.args.get("sentiment")
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        query = Feedback.query

        if category:
            query = query.filter_by(category=category)

        if sentiment:
            query = query.filter_by(sentiment=sentiment)

        total = query.count()
        feedbacks = query.order_by(Feedback.created_at.desc()).limit(limit).offset(offset).all()

        # Calculate statistics
        stats = {
            "total": total,
            "by_category": db.session.query(
                Feedback.category,
                db.func.count(Feedback.id)
            ).group_by(Feedback.category).all(),
            "by_sentiment": db.session.query(
                Feedback.sentiment,
                db.func.count(Feedback.id)
            ).group_by(Feedback.sentiment).all(),
            "average_rating": db.session.query(
                db.func.avg(Feedback.rating)
            ).scalar() or 0
        }

        return success_response({
            "feedbacks": [f.to_dict() for f in feedbacks],
            "stats": stats,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total
            }
        })

    except Exception as e:
        return error_response(f"Error fetching feedback: {str(e)}", 500)


@bp.route("/<int:feedback_id>/resolve", methods=["POST"])
@jwt_required()
def resolve_feedback(feedback_id):
    """
    Resolve feedback with admin response (admin only).
    
    Request body:
    {
        "admin_response": "Response text"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or user.role != "admin":
            return error_response("Admin access required", 403)

        feedback = Feedback.query.get(feedback_id)

        if not feedback:
            return error_response("Feedback not found", 404)

        data = request.get_json()

        feedback.is_resolved = True
        feedback.admin_response = data.get("admin_response", "")
        db.session.commit()

        return success_response({
            "message": "Feedback resolved successfully",
            "feedback": feedback.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return error_response(f"Error resolving feedback: {str(e)}", 500)
