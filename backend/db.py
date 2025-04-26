import mysql.connector

# Database Configuration
db_config = {
    "host": "buvdpvm918jfonwzvibq-mysql.services.clever-cloud.com",
    "user": "udmktifdo3wwwnth",    # Replace with your MySQL username
    "password": "LpCIiJ9bFdx2eekWOI4K", # Replace with your MySQL password
    "database": "buvdpvm918jfonwzvibq"   # Replace with your MySQL database name
}

# Create a connection function
def get_db_connection():
    return mysql.connector.connect(**db_config)
