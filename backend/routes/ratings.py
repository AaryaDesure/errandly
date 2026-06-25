from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Task, Rating

ratings_bp = Blueprint("ratings", __name__)

@ratings_bp.route("/", methods=["POST"])
@jwt_required()
def submit_rating():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    task = Task.query.get_or_404(data.get("task_id"))
    if task.customer_id != user_id:
        return jsonify({"error": "Only the customer can rate this task"}), 403
    if task.status != "done":
        return jsonify({"error": "Task must be completed before rating"}), 400
    if Rating.query.filter_by(task_id=task.id).first():
        return jsonify({"error": "Already rated"}), 400
    stars = data.get("stars")
    if not isinstance(stars, int) or not 1 <= stars <= 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
    rating = Rating(
        task_id=task.id,
        customer_id=user_id,
        helper_id=task.helper_id,
        stars=stars,
        review=data.get("review", "")
    )
    db.session.add(rating)
    db.session.commit()
    return jsonify({"message": "Rating submitted"}), 201

@ratings_bp.route("/helper/<int:helper_id>", methods=["GET"])
def get_helper_ratings(helper_id):
    ratings = Rating.query.filter_by(helper_id=helper_id).all()
    if not ratings:
        return jsonify({"average": 0, "count": 0, "reviews": []}), 200
    avg = sum(r.stars for r in ratings) / len(ratings)
    return jsonify({
        "average": round(avg, 1),
        "count": len(ratings),
        "reviews": [{"stars": r.stars, "review": r.review, "created_at": r.created_at.strftime("%b %Y")} for r in ratings]
    }), 200

@ratings_bp.route("/check/<int:task_id>", methods=["GET"])
@jwt_required()
def check_rating(task_id):
    existing = Rating.query.filter_by(task_id=task_id).first()
    return jsonify({"rated": existing is not None}), 200