import logging
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create user blueprint
user_logs_bp = Blueprint("userlogs", __name__)

@user_logs_bp.route("/my-logs", methods=["GET"])
@jwt_required()
def get_my_logs():
    """
    Retrieve logged emails generated/refined by the current user.
    """
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('id')  # Ensure 'id' is part of the JWT identity payload

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT 
                    id,
                    timestamp,
                    action,
                    email_content
                FROM email_log
                WHERE user_id = %s
                ORDER BY timestamp DESC
                LIMIT 100
            """, (user_id,))
            logs = cursor.fetchall()

            logger.info(f"Retrieved own logs for user {user_id}. Total logs: {len(logs)}")
            return jsonify(logs), 200

        except Exception as e:
            logger.error(f"My Logs Fetch Error for user {user_id}: {e}")
            return jsonify({"error": "Failed to retrieve your logs"}), 500

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Unexpected error in get_my_logs: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500
