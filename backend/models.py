import mysql.connector
from flask_jwt_extended import create_access_token
from datetime import datetime, timezone
from db import get_db_connection  # Ensure this function is properly defined

# ✅ Function to Get User by Email
def User(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id, email, password, is_admin FROM user WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    return user

# ✅ Function to Generate JWT Token for User
def generate_token(user):
    return create_access_token(identity={"id": user["id"], "email": user["email"], "is_admin": user["is_admin"]})

def EmailLog(user_id, email_content, action):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = "INSERT INTO email_log (user_id, email_content, timestamp, action) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (user_id, email_content, datetime.now(timezone.utc), action))
        conn.commit()
        
    except mysql.connector.Error as err:
        print("Error:", err)
    
    finally:
        cursor.close()
        conn.close()
