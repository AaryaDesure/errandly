from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db
from models import User
from extensions import limiter
'''import random
import string
from models import Referral'''

def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = generate_password_hash(data["password"])
    user = User(
        name=data["name"],
        email=data["email"],
        password=hashed_pw,
        role=data["role"]  # 'customer' or 'helper'
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(
    identity=str(user.id),
    additional_claims={"role": user.role}
)
    return jsonify({"token": token, "role": user.role, "name": user.name}), 200