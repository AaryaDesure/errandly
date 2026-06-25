import razorpay
import hmac
import hashlib
import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Task, Payment
from datetime import datetime
from models import Task, Payment, Notification
from extensions import limiter

def notify(user_id, message, type):
    n = Notification(user_id=user_id, message=message, type=type)
    db.session.add(n)

payments_bp = Blueprint("payments", __name__)

def get_razorpay_client():
    return razorpay.Client(
        auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
    )

def validate_task_data(data):
    if not data.get("title") or not data.get("description"):
        return "Title and description are required."
    if len(data.get("description", "")) < 20:
        return "Description must be at least 20 characters."
    if len(data.get("description", "")) > 500:
        return "Description cannot exceed 500 characters."
    if not data.get("location"):
        return "Location is required."
    if not data.get("category"):
        return "Category is required."
    try:
        reward = float(data.get("reward", 0))
        if reward <= 0:
            return "Reward must be greater than zero."
    except (ValueError, TypeError):
        return "Reward must be a valid number."
    return None

@payments_bp.route("/create-order", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")
def create_order():
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    if claims.get("role") != "customer":
        return jsonify({"error": "Only customers can post tasks"}), 403

    data = request.get_json()
    task_data = data.get("task_data", {})

    # Validate task data before charging
    error = validate_task_data(task_data)
    if error:
        return jsonify({"error": error}), 400

    reward = float(task_data["reward"])

    try:
        client = get_razorpay_client()
        # Razorpay amount is in paise (1 INR = 100 paise)
        razorpay_order = client.order.create({
            "amount": int(reward * 100),
            "currency": "INR",
            "receipt": f"errandly_{user_id}_{int(datetime.utcnow().timestamp())}",
            "notes": {
                "task_title": task_data.get("title", ""),
                "customer_id": str(user_id)
            }
        })
    except Exception as e:
        return jsonify({"error": "Payment gateway error. Please try again."}), 500

    # Store pending payment with task data
    payment = Payment(
        razorpay_order_id=razorpay_order["id"],
        amount=reward,
        status="pending",
        customer_id=user_id,
        task_data=json.dumps(task_data)
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "order_id": razorpay_order["id"],
        "amount": razorpay_order["amount"],
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID")
    }), 200


@payments_bp.route("/verify", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")
def verify_payment():
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    if claims.get("role") != "customer":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({"error": "Missing payment details"}), 400

    # Fetch stored payment record
    payment = Payment.query.filter_by(
        razorpay_order_id=razorpay_order_id,
        customer_id=user_id,
        status="pending"
    ).first()

    if not payment:
        return jsonify({"error": "Invalid or expired payment session"}), 400

    # Check for replay attack - payment_id already used
    existing = Payment.query.filter_by(
        razorpay_payment_id=razorpay_payment_id
    ).first()
    if existing:
        return jsonify({"error": "Payment already used"}), 400

    # Verify HMAC signature - this is the core security check
    secret = os.getenv("RAZORPAY_KEY_SECRET").encode("utf-8")
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(secret, message, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        payment.status = "failed"
        db.session.commit()
        return jsonify({"error": "Payment verification failed"}), 400

    # Payment verified — create the task
    task_data = json.loads(payment.task_data)

    task = Task(
        title=task_data["title"],
        description=task_data["description"],
        category=task_data["category"],
        reward=payment.amount,
        location=task_data["location"],
        customer_id=user_id,
        payment_status="paid",
        razorpay_order_id=razorpay_order_id
    )
    db.session.add(task)

    # Mark payment as paid
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = "paid"

    notify(user_id, f"Payment successful! Your task '{task.title}' is now live 🎉", "payment_success")

    db.session.commit()

    return jsonify({
        "message": "Payment verified. Task is now live!",
        "task_id": task.id
    }), 201

@payments_bp.route("/history", methods=["GET"])
@jwt_required()
def payment_history():
    user_id = int(get_jwt_identity())
    payments = Payment.query.filter_by(
        customer_id=user_id
    ).order_by(Payment.created_at.desc()).all()

    result = []
    for p in payments:
        task = Task.query.filter_by(razorpay_order_id=p.razorpay_order_id).first()
        result.append({
            "id": p.id,
            "amount": p.amount,
            "status": p.status,
            "razorpay_order_id": p.razorpay_order_id,
            "razorpay_payment_id": p.razorpay_payment_id,
            "created_at": p.created_at.strftime("%d %b %Y %H:%M"),
            "task_title": task.title if task else "Task not found",
            "task_status": task.status if task else "unknown",
            "task_id": task.id if task else None
        })
    return jsonify(result), 200