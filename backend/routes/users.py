from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Task, Rating

users_bp = Blueprint("users", __name__)

def build_helper_profile(user):
    ratings = Rating.query.filter_by(helper_id=user.id).all()
    completed = Task.query.filter_by(helper_id=user.id, status="done").count()
    avg = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else 0
    reviews = [{
        "stars": r.stars,
        "review": r.review,
        "created_at": r.created_at.strftime("%b %Y")
    } for r in sorted(ratings, key=lambda r: r.created_at, reverse=True)[:3]]

    return {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "member_since": user.created_at.strftime("%b %Y"),
        "total_completed": completed,
        "average_rating": avg,
        "total_ratings": len(ratings),
        "recent_reviews": reviews
    }

@users_bp.route("/profile/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(build_helper_profile(user)), 200

@users_bp.route("/profile/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_profile(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != "helper":
        return jsonify({"error": "Profile only available for helpers"}), 400
    return jsonify(build_helper_profile(user)), 200