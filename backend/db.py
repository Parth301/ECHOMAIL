import mysql.connector

# Database Configuration
db_config = {
    "host": "localhost",
    "user": "root",    # Replace with your MySQL username
    "password": "admin", # Replace with your MySQL password
    "database": "email_assistant"   # Replace with your MySQL database name
}

# Create a connection function
def get_db_connection():
    return mysql.connector.connect(**db_config)
