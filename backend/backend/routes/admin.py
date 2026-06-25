import os
import csv
import io
import json
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from extensions import db
from models import User, Task, Payment, Rating, Notification, AdminLog
from datetime import datetime, timedelta
from sqlalchemy import func
from functools import wraps

admin_bp = Blueprint("admin", __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper

def log_action(action, details=None):
    log = AdminLog(action=action, details=details)
    db.session.add(log)

def paginate_query(query, page, per_page):
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if (data.get("username") != os.getenv("ADMIN_USERNAME") or
            data.get("password") != os.getenv("ADMIN_PASSWORD")):
        return jsonify({"error": "Invalid admin credentials"}), 401
    token = create_access_token(
        identity="admin",
        additional_claims={"role": "admin"},
        expires_delta=timedelta(hours=8)
    )
    log_action("Admin login", f"Admin logged in at {datetime.utcnow().strftime('%d %b %Y %H:%M')}")
    db.session.commit()
    return jsonify({"token": token}), 200

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_customers = User.query.filter_by(role="customer").count()
    total_helpers = User.query.filter_by(role="helper").count()
    total_tasks = Task.query.count()
    open_tasks = Task.query.filter_by(status="open").count()
    completed_tasks = Task.query.filter_by(status="done").count()
    disputed_tasks = Task.query.filter_by(status="disputed").count()
    cancelled_tasks = Task.query.filter_by(status="cancelled").count()
    total_payments = Payment.query.filter_by(status="paid").count()
    total_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter_by(status="paid").scalar() or 0
    total_ratings = Rating.query.count()
    avg_rating = db.session.query(func.avg(Rating.stars)).scalar() or 0
    recent_tasks = Task.query.order_by(Task.created_at.desc()).limit(5).all()
    recent_payments = Payment.query.filter_by(
        status="paid"
    ).order_by(Payment.created_at.desc()).limit(5).all()
    return jsonify({
        "users": {
            "total": total_users,
            "customers": total_customers,
            "helpers": total_helpers
        },
        "tasks": {
            "total": total_tasks,
            "open": open_tasks,
            "completed": completed_tasks,
            "disputed": disputed_tasks,
            "cancelled": cancelled_tasks
        },
        "payments": {
            "total": total_payments,
            "revenue": round(total_revenue, 2)
        },
        "ratings": {
            "total": total_ratings,
            "average": round(float(avg_rating), 1)
        },
        "recent_tasks": [{
            "id": t.id, "title": t.title,
            "status": t.status, "reward": t.reward,
            "created_at": t.created_at.strftime("%d %b %Y")
        } for t in recent_tasks],
        "recent_payments": [{
            "id": p.id, "amount": p.amount,
            "status": p.status,
            "created_at": p.created_at.strftime("%d %b %Y")
        } for p in recent_payments]
    }), 200

@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def get_analytics():
    # Last 30 days daily revenue
    days = 30
    daily_revenue = []
    daily_tasks = []
    for i in range(days - 1, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59)
        rev = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == "paid",
            Payment.created_at >= start,
            Payment.created_at <= end
        ).scalar() or 0
        tasks = Task.query.filter(
            Task.created_at >= start,
            Task.created_at <= end
        ).count()
        daily_revenue.append({
            "date": day.strftime("%d %b"),
            "revenue": round(float(rev), 2)
        })
        daily_tasks.append({
            "date": day.strftime("%d %b"),
            "tasks": tasks
        })

    # Tasks by category
    categories = db.session.query(
        Task.category,
        func.count(Task.id)
    ).group_by(Task.category).all()

    # Tasks by status
    statuses = db.session.query(
        Task.status,
        func.count(Task.id)
    ).group_by(Task.status).all()

    # Monthly user growth
    monthly_users = []
    for i in range(5, -1, -1):
        month_start = (datetime.utcnow().replace(day=1) - timedelta(days=30*i))
        month_end = (datetime.utcnow().replace(day=1) - timedelta(days=30*(i-1))) if i > 0 else datetime.utcnow()
        count = User.query.filter(
            User.created_at >= month_start,
            User.created_at <= month_end
        ).count()
        monthly_users.append({
            "month": month_start.strftime("%b %Y"),
            "users": count
        })

    # Top categories by revenue
    cat_revenue = db.session.query(
        Task.category,
        func.sum(Task.reward)
    ).filter_by(status="done").group_by(Task.category).all()

    return jsonify({
        "daily_revenue": daily_revenue,
        "daily_tasks": daily_tasks,
        "by_category": [{"category": c, "count": n} for c, n in categories],
        "by_status": [{"status": s, "count": n} for s, n in statuses],
        "monthly_users": monthly_users,
        "category_revenue": [{"category": c, "revenue": round(float(r), 2)} for c, r in cat_revenue]
    }), 200

@admin_bp.route("/ai-insights", methods=["GET"])
@admin_required
def get_ai_insights():
    total_users = User.query.count()
    total_tasks = Task.query.count()
    completed = Task.query.filter_by(status="done").count()
    disputed = Task.query.filter_by(status="disputed").count()
    cancelled = Task.query.filter_by(status="cancelled").count()
    open_tasks = Task.query.filter_by(status="open").count()
    revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter_by(status="paid").scalar() or 0
    avg_rating = db.session.query(func.avg(Rating.stars)).scalar() or 0
    top_category = db.session.query(
        Task.category, func.count(Task.id)
    ).group_by(Task.category).order_by(func.count(Task.id).desc()).first()
    completion_rate = round((completed / total_tasks * 100), 1) if total_tasks > 0 else 0
    dispute_rate = round((disputed / total_tasks * 100), 1) if total_tasks > 0 else 0
    cancellation_rate = round((cancelled / total_tasks * 100), 1) if total_tasks > 0 else 0
    avg_reward = db.session.query(func.avg(Task.reward)).scalar() or 0

    insights = []
    recommendations = []
    risks = []

    # Key Insights
    if completion_rate >= 70:
        insights.append(f"✅ Strong completion rate of {completion_rate}% — helpers are reliably completing tasks.")
    elif completion_rate >= 40:
        insights.append(f"⚠️ Moderate completion rate of {completion_rate}% — there is room for improvement in task fulfilment.")
    else:
        insights.append(f"❌ Low completion rate of {completion_rate}% — many tasks are going unfinished.")

    if float(avg_rating) >= 4.5:
        insights.append(f"⭐ Excellent average helper rating of {round(float(avg_rating), 1)}/5 — customers are highly satisfied.")
    elif float(avg_rating) >= 3.5:
        insights.append(f"⭐ Good average rating of {round(float(avg_rating), 1)}/5 — most customers are satisfied with helpers.")
    else:
        insights.append(f"⭐ Below average rating of {round(float(avg_rating), 1)}/5 — helper quality needs attention.")

    if total_users > 0:
        helper_count = User.query.filter_by(role="helper").count()
        customer_count = User.query.filter_by(role="customer").count()
        ratio = round(customer_count / helper_count, 1) if helper_count > 0 else 0
        if ratio > 3:
            insights.append(f"📊 High customer-to-helper ratio of {ratio}:1 — more helpers are needed to meet demand.")
        elif ratio < 1:
            insights.append(f"📊 More helpers than customers ({ratio}:1 ratio) — focus on customer acquisition.")
        else:
            insights.append(f"📊 Balanced platform ratio of {ratio} customers per helper — healthy supply and demand.")

    # Recommendations
    if open_tasks > 10:
        recommendations.append(f"🔔 {open_tasks} tasks are currently open — consider notifying more helpers to accept tasks.")
    if dispute_rate > 10:
        recommendations.append(f"⚠️ Dispute rate is {dispute_rate}% — consider adding helper verification or clearer task guidelines.")
    elif dispute_rate > 0:
        recommendations.append(f"📋 Dispute rate is low at {dispute_rate}% — maintain quality by monitoring helper performance.")
    if cancellation_rate > 20:
        recommendations.append(f"❌ Cancellation rate of {cancellation_rate}% is high — review task pricing or add cancellation penalties.")
    if float(avg_reward) < 200:
        recommendations.append(f"💰 Average reward of ₹{round(float(avg_reward))} is low — encourage higher rewards to attract more helpers.")
    else:
        recommendations.append(f"💰 Average reward of ₹{round(float(avg_reward))} is healthy — good incentive for helpers.")
    if top_category:
        recommendations.append(f"📦 '{top_category[0].capitalize()}' is the most popular category — consider promoting it more on the landing page.")

    # Risks
    if dispute_rate > 15:
        risks.append(f"🚨 High dispute rate of {dispute_rate}% could damage platform trust and helper retention.")
    if open_tasks > completed and total_tasks > 5:
        risks.append(f"⚡ More open tasks ({open_tasks}) than completed ({completed}) — platform supply may not meet demand.")
    if total_users < 10:
        risks.append("👥 Low user base — platform needs more marketing to reach critical mass.")
    if float(avg_rating) < 3 and Rating.query.count() > 0:
        risks.append("⭐ Low average rating is a risk — poor helper quality could drive customers away.")
    if not risks:
        risks.append("✅ No major risks detected — platform is operating within healthy parameters.")

    # Health Score
    score = 5
    if completion_rate >= 70: score += 1.5
    elif completion_rate >= 40: score += 0.5
    if float(avg_rating) >= 4.5: score += 1.5
    elif float(avg_rating) >= 3.5: score += 0.5
    if dispute_rate < 5: score += 1
    elif dispute_rate > 15: score -= 1
    if cancellation_rate < 10: score += 0.5
    score = min(10, max(1, round(score, 1)))

    if score >= 8:
        health = f"🟢 {score}/10 — Platform is performing excellently."
    elif score >= 6:
        health = f"🟡 {score}/10 — Platform is performing well with room for growth."
    elif score >= 4:
        health = f"🟠 {score}/10 — Platform needs attention in key areas."
    else:
        health = f"🔴 {score}/10 — Platform requires immediate improvements."

    formatted = f"""📊 KEY INSIGHTS
{'─' * 40}
{chr(10).join(f'{i+1}. {item}' for i, item in enumerate(insights))}

💡 RECOMMENDATIONS
{'─' * 40}
{chr(10).join(f'{i+1}. {item}' for i, item in enumerate(recommendations))}

⚠️ RISKS & CONCERNS
{'─' * 40}
{chr(10).join(f'{i+1}. {item}' for i, item in enumerate(risks))}

🏥 OVERALL PLATFORM HEALTH
{'─' * 40}
{health}"""

    log_action("AI Insights Generated", "Admin requested platform analysis")
    db.session.commit()

    return jsonify({
        "insights": formatted,
        "generated_at": datetime.utcnow().strftime("%d %b %Y %H:%M"),
        "stats_used": {
            "total_users": total_users,
            "completion_rate": completion_rate,
            "dispute_rate": dispute_rate,
            "avg_rating": round(float(avg_rating), 1),
            "revenue": round(float(revenue), 2)
        }
    }), 200

@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    search = request.args.get("search", "").strip()
    role = request.args.get("role", "").strip()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    query = User.query
    if search:
        query = query.filter(db.or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        ))
    if role:
        query = query.filter_by(role=role)
    query = query.order_by(User.created_at.desc())
    users, total = paginate_query(query, page, per_page)
    result = []
    for u in users:
        tasks_posted = Task.query.filter_by(customer_id=u.id).count() if u.role == "customer" else 0
        tasks_done = Task.query.filter_by(helper_id=u.id, status="done").count() if u.role == "helper" else 0
        ratings = Rating.query.filter_by(helper_id=u.id).all()
        avg = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else 0
        result.append({
            "id": u.id, "name": u.name, "email": u.email,
            "role": u.role,
            "member_since": u.created_at.strftime("%d %b %Y"),
            "tasks_posted": tasks_posted,
            "tasks_done": tasks_done,
            "avg_rating": avg,
            "total_ratings": len(ratings)
        })
    return jsonify({"data": result, "total": total, "page": page, "per_page": per_page}), 200

@admin_bp.route("/tasks", methods=["GET"])
@admin_required
def get_tasks():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    query = Task.query
    if search:
        query = query.filter(db.or_(
            Task.title.ilike(f"%{search}%"),
            Task.description.ilike(f"%{search}%")
        ))
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if start_date:
        query = query.filter(Task.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Task.created_at <= datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59))
    query = query.order_by(Task.created_at.desc())
    tasks, total = paginate_query(query, page, per_page)
    result = []
    for t in tasks:
        customer = User.query.get(t.customer_id)
        helper = User.query.get(t.helper_id) if t.helper_id else None
        result.append({
            "id": t.id, "title": t.title,
            "description": t.description,
            "category": t.category, "status": t.status,
            "reward": t.reward, "location": t.location,
            "payment_status": t.payment_status,
            "customer_name": customer.name if customer else "N/A",
            "customer_email": customer.email if customer else "N/A",
            "helper_name": helper.name if helper else "Not assigned",
            "completion_note": t.completion_note,
            "dispute_reason": t.dispute_reason,
            "created_at": t.created_at.strftime("%d %b %Y %H:%M"),
            "accepted_at": t.accepted_at.strftime("%d %b %Y %H:%M") if t.accepted_at else None,
            "completed_at": t.completed_at.strftime("%d %b %Y %H:%M") if t.completed_at else None,
            "confirmed_at": t.confirmed_at.strftime("%d %b %Y %H:%M") if t.confirmed_at else None,
        })
    return jsonify({"data": result, "total": total, "page": page, "per_page": per_page}), 200

@admin_bp.route("/payments", methods=["GET"])
@admin_required
def get_payments():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    query = Payment.query
    if status:
        query = query.filter_by(status=status)
    if start_date:
        query = query.filter(Payment.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Payment.created_at <= datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59))
    query = query.order_by(Payment.created_at.desc())
    payments, total = paginate_query(query, page, per_page)
    result = []
    for p in payments:
        customer = User.query.get(p.customer_id)
        task = Task.query.filter_by(razorpay_order_id=p.razorpay_order_id).first()
        if search and customer:
            if search.lower() not in customer.name.lower() and search.lower() not in customer.email.lower():
                continue
        result.append({
            "id": p.id, "amount": p.amount, "status": p.status,
            "razorpay_order_id": p.razorpay_order_id,
            "razorpay_payment_id": p.razorpay_payment_id,
            "customer_name": customer.name if customer else "N/A",
            "customer_email": customer.email if customer else "N/A",
            "task_title": task.title if task else "N/A",
            "task_id": task.id if task else None,
            "created_at": p.created_at.strftime("%d %b %Y %H:%M")
        })
    return jsonify({"data": result, "total": total, "page": page, "per_page": per_page}), 200

@admin_bp.route("/disputes", methods=["GET"])
@admin_required
def get_disputes():
    tasks = Task.query.filter_by(
        status="disputed"
    ).order_by(Task.created_at.desc()).all()
    result = []
    for t in tasks:
        customer = User.query.get(t.customer_id)
        helper = User.query.get(t.helper_id) if t.helper_id else None
        result.append({
            "id": t.id, "title": t.title,
            "reward": t.reward, "location": t.location,
            "dispute_reason": t.dispute_reason,
            "completion_note": t.completion_note,
            "customer_name": customer.name if customer else "N/A",
            "customer_email": customer.email if customer else "N/A",
            "helper_name": helper.name if helper else "N/A",
            "helper_email": helper.email if helper else "N/A",
            "created_at": t.created_at.strftime("%d %b %Y %H:%M"),
            "completed_at": t.completed_at.strftime("%d %b %Y %H:%M") if t.completed_at else None
        })
    return jsonify(result), 200

@admin_bp.route("/disputes/<int:task_id>/resolve", methods=["PATCH"])
@admin_required
def resolve_dispute(task_id):
    data = request.get_json()
    resolution = data.get("resolution")
    note = data.get("note", "")
    if resolution not in ["favor_customer", "favor_helper"]:
        return jsonify({"error": "Invalid resolution"}), 400
    task = Task.query.get_or_404(task_id)
    if task.status != "disputed":
        return jsonify({"error": "Task is not disputed"}), 400
    if resolution == "favor_customer":
        task.status = "cancelled"
        if task.customer_id:
            n = Notification(
                user_id=task.customer_id,
                message=f"Dispute on '{task.title}' resolved in your favor by admin.",
                type="dispute_resolved"
            )
            db.session.add(n)
        if task.helper_id:
            n = Notification(
                user_id=task.helper_id,
                message=f"Dispute on '{task.title}' was resolved in the customer's favor.",
                type="dispute_resolved"
            )
            db.session.add(n)
    else:
        task.status = "done"
        task.confirmed_at = datetime.utcnow()
        if task.helper_id:
            n = Notification(
                user_id=task.helper_id,
                message=f"Dispute on '{task.title}' resolved in your favor by admin! ✅",
                type="dispute_resolved"
            )
            db.session.add(n)
        if task.customer_id:
            n = Notification(
                user_id=task.customer_id,
                message=f"Dispute on '{task.title}' was resolved in the helper's favor.",
                type="dispute_resolved"
            )
            db.session.add(n)
    log_action(
        f"Dispute Resolved — {resolution.replace('_', ' ')}",
        f"Task #{task_id}: {task.title} | Note: {note}"
    )
    db.session.commit()
    return jsonify({"message": "Dispute resolved successfully"}), 200

@admin_bp.route("/leaderboard", methods=["GET"])
@admin_required
def get_leaderboard():
    helpers = User.query.filter_by(role="helper").all()
    result = []
    for h in helpers:
        tasks_done = Task.query.filter_by(helper_id=h.id, status="done").count()
        ratings = Rating.query.filter_by(helper_id=h.id).all()
        avg = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else 0
        total_earned = db.session.query(
            func.sum(Task.reward)
        ).filter_by(helper_id=h.id, status="done").scalar() or 0
        result.append({
            "id": h.id, "name": h.name, "email": h.email,
            "tasks_done": tasks_done, "avg_rating": avg,
            "total_ratings": len(ratings),
            "total_earned": round(float(total_earned), 2),
            "member_since": h.created_at.strftime("%b %Y")
        })
    result.sort(key=lambda x: (x["tasks_done"], x["avg_rating"]), reverse=True)
    for i, h in enumerate(result):
        h["rank"] = i + 1
    return jsonify(result), 200

@admin_bp.route("/export/<string:data_type>", methods=["GET"])
@admin_required
def export_data(data_type):
    output = io.StringIO()
    writer = csv.writer(output)
    if data_type == "users":
        writer.writerow(["ID", "Name", "Email", "Role", "Joined"])
        for u in User.query.order_by(User.created_at.desc()).all():
            writer.writerow([u.id, u.name, u.email, u.role, u.created_at.strftime("%d %b %Y")])
        log_action("Export", "Exported users CSV")
    elif data_type == "tasks":
        writer.writerow(["ID", "Title", "Category", "Status", "Reward", "Location", "Created"])
        for t in Task.query.order_by(Task.created_at.desc()).all():
            writer.writerow([t.id, t.title, t.category, t.status, t.reward, t.location, t.created_at.strftime("%d %b %Y")])
        log_action("Export", "Exported tasks CSV")
    elif data_type == "payments":
        writer.writerow(["ID", "Amount", "Status", "Order ID", "Payment ID", "Created"])
        for p in Payment.query.order_by(Payment.created_at.desc()).all():
            writer.writerow([p.id, p.amount, p.status, p.razorpay_order_id, p.razorpay_payment_id or "N/A", p.created_at.strftime("%d %b %Y")])
        log_action("Export", "Exported payments CSV")
    else:
        return jsonify({"error": "Invalid export type"}), 400
    db.session.commit()
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=errandly_{data_type}.csv"}
    )

@admin_bp.route("/logs", methods=["GET"])
@admin_required
def get_logs():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    query = AdminLog.query.order_by(AdminLog.created_at.desc())
    logs, total = paginate_query(query, page, per_page)
    return jsonify({
        "data": [{
            "id": l.id,
            "action": l.action,
            "details": l.details,
            "created_at": l.created_at.strftime("%d %b %Y %H:%M:%S")
        } for l in logs],
        "total": total,
        "page": page,
        "per_page": per_page
    }), 200