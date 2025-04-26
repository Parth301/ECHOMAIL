from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.config import Config
from backend.routes.auth_routes import auth_bp
from backend.routes.email_routes import email_bp
from backend.routes.analytics_routes import analytics_bp
from backend.routes.admin_routes import admin_bp
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

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Email Assistant API!"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)