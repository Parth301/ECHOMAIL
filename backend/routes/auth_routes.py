import os
import re
import logging
from flask import Blueprint, request, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create authentication blueprint
auth_bp = Blueprint("auth", __name__)

def validate_email(email):
    """
    Validate email format using comprehensive regex
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Enhanced user registration with robust validation and error handling
    """
    try:
        # Parse request data
        data = request.json
        
        # Validate input data
        if not data:
            return jsonify({"error": "No input data provided"}), 400
        
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        # Comprehensive input validation
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

        # Database connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Check if email already exists
            cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({"error": "Email already registered"}), 409

            # Hash password securely
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

            # Insert new user with default non-admin status
            cursor.execute(
                "INSERT INTO user (email, password, is_admin, created_at, active) VALUES (%s, %s, %s, NOW(), %s)", 
                (email, hashed_password, False, True)
            )
            conn.commit()

            logger.info(f"User registered successfully: {email}")
            return jsonify({"message": "User registered successfully"}), 201

        except mysql.connector.Error as err:
            conn.rollback()
            logger.error(f"Database Error during registration: {err}")
            return jsonify({"error": "Registration failed. Please try again."}), 500

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Enhanced login route with comprehensive validation and security
    """
    try:
        # Parse request data
        data = request.json
        
        # Validate input data
        if not data:
            return jsonify({"error": "No input data provided"}), 400
        
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        # Validate inputs
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        # Database connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            # Fetch user with comprehensive query
            cursor.execute("""
                SELECT id, email, password, is_admin 
                FROM user 
                WHERE email = %s AND active = 1
            """, (email,))
            user = cursor.fetchone()

            # Comprehensive authentication checks
            if not user or not check_password_hash(user['password'], password):
                logger.warning(f"Failed login attempt for email: {email}")
                return jsonify({"error": "Invalid credentials"}), 401

            # Create access token with comprehensive payload
            access_token = create_access_token(identity={
                "id": user['id'],
                "email": user['email'],
                "is_admin": user['is_admin']
            })

            logger.info(f"Successful login for user: {email}")
            return jsonify({
                "token": access_token,
                "is_admin": user['is_admin'],
                "user_id": user['id']
            }), 200

        except Exception as e:
            logger.error(f"Login Error: {e}")
            return jsonify({"error": "Login failed. Please try again."}), 500

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500