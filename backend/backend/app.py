from dotenv import load_dotenv
import os

from flask_limiter import RateLimitExceeded
load_dotenv()

from flask import Flask, app, jsonify
from extensions import db, limiter
from flask_jwt_extended import JWTManager
from flask_cors import CORS



def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    ...
    CORS(app)
    db.init_app(app)
    JWTManager(app)
    limiter.init_app(app)

    from routes.auth import auth_bp
    from routes.tasks import tasks_bp
    from routes.ratings import ratings_bp
    from routes.payments import payments_bp
    from routes.users import users_bp
    from routes.notifications import notifications_bp
    from flask_limiter.errors import RateLimitExceeded
    from routes.admin import admin_bp
    
    app.register_blueprint(admin_bp, url_prefix="/admin")

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit(e):
        return jsonify({
            "error": "Too many requests. Please slow down and try again shortly."
        }), 429
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500
    
    
    app.register_blueprint(notifications_bp, url_prefix="/notifications")
    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(payments_bp, url_prefix="/payments")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(tasks_bp, url_prefix="/tasks")
    app.register_blueprint(ratings_bp, url_prefix="/ratings")

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)