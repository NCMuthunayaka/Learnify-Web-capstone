from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token

bcrypt = Bcrypt()

class AuthService:
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        return bcrypt.generate_password_hash(password).decode('utf-8')
    
    @staticmethod
    def verify_password(password_hash, password):
        """Verify a password against its hash"""
        return bcrypt.check_password_hash(password_hash, password)
    
    @staticmethod
    def create_tokens(user_id):
        """Create access and refresh tokens"""
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        return {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    
    @staticmethod
    def refresh_access_token(user_id):
        """Create a new access token from refresh token"""
        access_token = create_access_token(identity=user_id)
        return {'access_token': access_token}