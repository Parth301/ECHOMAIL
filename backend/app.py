from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from routes.auth_routes import auth_bp
from routes.email_routes import email_bp
from routes.analytics_routes import analytics_bp
from routes.admin_routes import admin_bp
from routes.user_logs import user_logs_bp
from flask import Flask, jsonify

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}})
jwt = JWTManager(app) 

# Register Blueprints (routes)
app.register_blueprint(auth_bp, url_prefix="/auth")  # Authentication routes
app.register_blueprint(email_bp, url_prefix="/email")  # Email-related routes
app.register_blueprint(analytics_bp, url_prefix="/analytics")  # Analytics routes
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(user_logs_bp, url_prefix="/userlogs")

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Email Assistant API!"})

if __name__ == "__main__":
    app.run()
