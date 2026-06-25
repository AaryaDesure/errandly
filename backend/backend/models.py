from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    '''referral_code = db.Column(db.String(20), unique=True, nullable=True)
    referral_credits = db.Column(db.Float, default=0.0)'''

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(30), default="open")
    reward = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(100), nullable=False, default="Not specified")
    customer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    helper_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    completion_note = db.Column(db.Text, nullable=True)
    dispute_reason = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payment_status = db.Column(db.String(20), default="unpaid")
    razorpay_order_id = db.Column(db.String(100), nullable=True)
    accepted_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=False, unique=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    helper_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    stars = db.Column(db.Integer, nullable=False)
    review = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    razorpay_order_id = db.Column(db.String(100), unique=True, nullable=False)
    razorpay_payment_id = db.Column(db.String(100), unique=True, nullable=True)
    razorpay_signature = db.Column(db.String(300), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")
    customer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    task_data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    message = db.Column(db.String(300), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AdminLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(200), nullable=False)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


'''class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    status = db.Column(db.String(20), default="pending")
    reward_amount = db.Column(db.Float, default=50.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)'''