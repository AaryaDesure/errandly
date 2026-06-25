from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Task, User
from datetime import datetime
from models import Task, User, Notification
from extensions import limiter

def notify(user_id, message, type):
    n = Notification(user_id=user_id, message=message, type=type)
    db.session.add(n)


tasks_bp = Blueprint("tasks", __name__)

def task_to_dict(t, include_helper=False, include_customer=False):
    data = {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "category": t.category,
        "reward": t.reward,
        "status": t.status,
        "location": t.location,
        "customer_id": t.customer_id,
        "helper_id": t.helper_id,
        "completion_note": t.completion_note,
        "dispute_reason": t.dispute_reason,
        "created_at": t.created_at.strftime("%d %b %Y") if t.created_at else None,
        "payment_status": t.payment_status,
        "razorpay_order_id": t.razorpay_order_id,
        "accepted_at": t.accepted_at.strftime("%d %b %Y %H:%M") if t.accepted_at else None,
        "completed_at": t.completed_at.strftime("%d %b %Y %H:%M") if t.completed_at else None,
        "confirmed_at": t.confirmed_at.strftime("%d %b %Y %H:%M") if t.confirmed_at else None,
    }
    if include_helper and t.helper_id:
        helper = User.query.get(t.helper_id)
        if helper:
            data["helper_name"] = helper.name
            data["helper_email"] = helper.email
    if include_customer and t.customer_id:
        customer = User.query.get(t.customer_id)
        if customer:
            data["customer_name"] = customer.name
    return data

@tasks_bp.route("/", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    query = Task.query.filter(
    Task.status == "open",
    Task.customer_id != int(user_id),
    Task.payment_status == "paid"
    )
    search = request.args.get("search", "").strip()
    if search:
        query = query.filter(
            db.or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )
    category = request.args.get("category", "").strip()
    if category:
        query = query.filter(Task.category == category)
    sort = request.args.get("sort", "newest")
    if sort == "highest":
        query = query.order_by(Task.reward.desc())
    elif sort == "lowest":
        query = query.order_by(Task.reward.asc())
    else:
        query = query.order_by(Task.created_at.desc())
    return jsonify([task_to_dict(t) for t in query.all()]), 200

@tasks_bp.route("/mine", methods=["GET"])
@jwt_required()
def get_my_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(
        customer_id=int(user_id)
    ).order_by(Task.created_at.desc()).all()
    return jsonify([task_to_dict(t, include_helper=True) for t in tasks]), 200

@tasks_bp.route("/accepted", methods=["GET"])
@jwt_required()
def get_accepted_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter(
        Task.helper_id == int(user_id),
        Task.status.in_(["assigned", "pending_confirmation"])
    ).all()
    return jsonify([task_to_dict(t, include_customer=True) for t in tasks]), 200

@tasks_bp.route("/completed", methods=["GET"])
@jwt_required()
def get_completed_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(
        helper_id=int(user_id), status="done"
    ).order_by(Task.confirmed_at.desc()).all()
    return jsonify([task_to_dict(t, include_customer=True) for t in tasks]), 200

@tasks_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_helper_stats():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(helper_id=int(user_id), status="done").all()
    monthly = {}
    category_counts = {}
    total_earned = 0
    for t in tasks:
        month = t.created_at.strftime("%b %Y")
        if month not in monthly:
            monthly[month] = {"tasks": 0, "earned": 0}
        monthly[month]["tasks"] += 1
        monthly[month]["earned"] += t.reward
        total_earned += t.reward
        category_counts[t.category] = category_counts.get(t.category, 0) + 1
    return jsonify({
        "total_tasks": len(tasks),
        "total_earned": total_earned,
        "monthly": [{"month": k, "tasks": v["tasks"], "earned": v["earned"]} for k, v in monthly.items()],
        "by_category": [{"category": k, "count": v} for k, v in category_counts.items()]
    }), 200

@tasks_bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")
def create_task():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if claims.get("role") != "customer":
        return jsonify({"error": "Only customers can post tasks"}), 403
    data = request.get_json()
    if not data.get("title") or not data.get("description"):
        return jsonify({"error": "Title and description are required."}), 400
    if len(data.get("description", "")) < 20:
        return jsonify({"error": "Description must be at least 20 characters."}), 400
    if not data.get("location"):
        return jsonify({"error": "Location is required."}), 400
    try:
        reward = float(data.get("reward", 0))
        if reward <= 0:
            return jsonify({"error": "Reward must be greater than zero."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Reward must be a valid number."}), 400
    task = Task(
        title=data["title"],
        description=data["description"],
        category=data["category"],
        reward=reward,
        location=data["location"],
        customer_id=int(user_id)
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created"}), 201

@tasks_bp.route("/<int:task_id>/accept", methods=["PATCH"])
@jwt_required()
def accept_task(task_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    if claims.get("role") != "helper":
        return jsonify({"error": "Only helpers can accept tasks"}), 403
    task = Task.query.with_for_update().get_or_404(task_id)
    if task.customer_id == user_id:
        return jsonify({"error": "You cannot accept your own task"}), 403
    if task.status != "open":
        return jsonify({"error": "Task already accepted by another helper"}), 400
    task.helper_id = user_id
    task.status = "assigned"
    task.accepted_at = datetime.utcnow()
    notify(task.customer_id, f"Your task '{task.title}' was accepted by a helper!", "task_accepted")
    notify(user_id, f"You accepted '{task.title}'. Get to work! 💪", "task_accepted")
    db.session.commit()
    return jsonify({"message": "Task accepted"}), 200

@tasks_bp.route("/<int:task_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    if task.helper_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    if task.status != "assigned":
        return jsonify({"error": "Task is not in progress"}), 400
    data = request.get_json() or {}
    task.completion_note = data.get("completion_note", "")
    task.status = "pending_confirmation"
    task.completed_at = datetime.utcnow()
    notify(task.customer_id, f"Your task '{task.title}' has been completed. Please confirm!", "task_completed")
    notify(user_id, f"You marked '{task.title}' complete. Awaiting customer confirmation ⏳", "task_completed")
    db.session.commit()
    return jsonify({"message": "Awaiting customer confirmation"}), 200

@tasks_bp.route("/<int:task_id>/confirm", methods=["PATCH"])
@jwt_required()
def confirm_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    if task.customer_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    if task.status != "pending_confirmation":
        return jsonify({"error": "Task is not pending confirmation"}), 400
    task.status = "done"
    task.confirmed_at = datetime.utcnow()
    notify(task.helper_id, f"Your completion of '{task.title}' was confirmed! Payment released ✅", "task_confirmed")
    notify(user_id, f"You confirmed '{task.title}' as complete.", "task_confirmed")
    db.session.commit()
    return jsonify({"message": "Task confirmed complete"}), 200

@tasks_bp.route("/<int:task_id>/dispute", methods=["PATCH"])
@jwt_required()
def dispute_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    if task.customer_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    if task.status != "pending_confirmation":
        return jsonify({"error": "Task is not pending confirmation"}), 400
    data = request.get_json() or {}
    task.dispute_reason = data.get("dispute_reason", "Not specified")
    task.status = "disputed"
    notify(task.helper_id, f"A dispute was raised on '{task.title}'. Reason: {task.dispute_reason}", "task_disputed")
    notify(user_id, f"You raised a dispute on '{task.title}'.", "task_disputed")
    db.session.commit()
    return jsonify({"message": "Task disputed"}), 200

@tasks_bp.route("/<int:task_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    if task.customer_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    if task.status != "open":
        return jsonify({"error": "Only open tasks can be cancelled"}), 400
    task.status = "cancelled"
    notify(user_id, f"Your task '{task.title}' was cancelled.", "task_cancelled")
    db.session.commit()
    return jsonify({"message": "Task cancelled"}), 200