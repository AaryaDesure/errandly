from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Referral
from datetime import datetime

referrals_bp = Blueprint("referrals", __name__)

@referrals_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_referral_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    pending = [r for r in referrals if r.status == "pending"]
    completed = [r for r in referrals if r.status == "completed"]
    result = []
    for r in referrals:
        referred = User.query.get(r.referred_id)
        result.append({
            "id": r.id,
            "referred_name": referred.name if referred else "Unknown",
            "referred_role": referred.role if referred else "unknown",
            "status": r.status,
            "reward_amount": r.reward_amount,
            "created_at": r.created_at.strftime("%d %b %Y"),
            "completed_at": r.completed_at.strftime("%d %b %Y") if r.completed_at else None
        })
    return jsonify({
        "referral_code": user.referral_code,
        "total_referrals": len(referrals),
        "pending": len(pending),
        "completed": len(completed),
        "total_credits": user.referral_credits,
        "reward_per_referral": 50,
        "referrals": result
    }), 200