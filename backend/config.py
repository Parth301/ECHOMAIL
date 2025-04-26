import os

class Config:
    SECRET_KEY = "a3f5d6g8h9j0k1l2m3n4p5q6r7s8t9u0"
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:admin@localhost/email_assistant"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


    # 🔹 Add complete JWT configurations
    JWT_SECRET_KEY = "21317553ac354d884ff660a739b1624cadeff6b6e2cd39d377baa3e42a38d98c"
    JWT_TOKEN_LOCATION = ["headers"]  # Ensure JWT is read from headers
    JWT_ACCESS_TOKEN_EXPIRES = False  # Disable token expiration (optional)
    JWT_HEADER_NAME = "Authorization"  # Default is "Authorization"
    JWT_HEADER_TYPE = "Bearer"  # Default is "Bearer"