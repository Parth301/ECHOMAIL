from flask_jwt_extended import create_access_token, decode_token

def generate_jwt(user):
    return create_access_token(identity={"id": user.id, "email": user.email, "is_admin": user.is_admin})

def decode_jwt(token):
    return decode_token(token)