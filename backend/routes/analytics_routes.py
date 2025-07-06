from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/api/analytics", methods=["POST"])
@jwt_required()
def get_analytics():
    """
    Fetch analytics data for the logged-in user including trend per weekday.
    """
    identity = get_jwt_identity()

    # Correct check
    if not identity or "sub" not in identity or "id" not in identity["sub"]:
        return jsonify({"error": "User ID not found in token"}), 401

    user_id = identity["id"]
    print(f"🔍 Fetching analytics for user ID: {user_id}")  # Debugging

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Total counts
        cursor.execute("""
            SELECT COUNT(*) AS total_emails, 
                   SUM(CASE WHEN action = 'generated' THEN 1 ELSE 0 END) AS generated_count,
                   SUM(CASE WHEN action = 'refined' THEN 1 ELSE 0 END) AS refined_count,
                   SUM(CASE WHEN action = 'sent' THEN 1 ELSE 0 END) AS sent_count
            FROM email_log
            WHERE user_id = %s;
        """, (user_id,))  

        analytics_data = cursor.fetchone() or {
            "total_emails": 0,
            "generated_count": 0,
            "refined_count": 0,
            "sent_count": 0
        }

        # Trend by weekday (Mon–Sun)
        cursor.execute("""
            SELECT 
                DATE_FORMAT(timestamp, '%a') AS day,
                COUNT(*) AS count
            FROM email_log
            WHERE user_id = %s
            GROUP BY DAYOFWEEK(timestamp), day;
        """, (user_id,))
        trend_rows = cursor.fetchall()

        weekday_order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        trend_map = {row['day']: row['count'] for row in trend_rows}
        trend = [{'day': day, 'count': trend_map.get(day, 0)} for day in weekday_order]

        response = {
            **analytics_data,
            "trend": trend
        }

        print("✅ Analytics Response:", response)
        return jsonify(response), 200

    except Exception as e:
        print(f"❌ Analytics Error: {e}")
        return jsonify({"error": "Failed to fetch analytics"}), 500

    finally:
        cursor.close()
        conn.close()
