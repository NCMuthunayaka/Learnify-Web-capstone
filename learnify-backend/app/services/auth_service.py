from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.extensions import db
from datetime import timedelta

class AuthService:
    @staticmethod
    def _generate_username(first_name, last_name, email):
        base_name = f"{first_name}.{last_name}".strip().replace(" ", "").lower()
        if not base_name:
            base_name = email.split("@")[0].lower()

        username = base_name
        suffix = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_name}{suffix}"
            suffix += 1
        return username

    @staticmethod
    def register(email, first_name, last_name, password, role="student"):
        """Register a new user"""
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already exists")

        username = AuthService._generate_username(first_name, last_name, email)

        # Create new user
        user = User(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            password_hash=generate_password_hash(password),
            role=role,
            is_active=True
        )

        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(minutes=15)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "avatar_url": user.avatar_url,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def login(email, password):
        """Login user and return tokens"""
        user = User.query.filter_by(email=email).first()
        
        if not user:
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("Account is inactive")
        
        if not check_password_hash(user.password_hash, password):
            raise ValueError("Invalid email or password")
        
        # Generate tokens
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(minutes=15)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "avatar_url": user.avatar_url
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def refresh_token(refresh_token):
        """Generate new access token from refresh token"""
        # This is handled by flask_jwt_extended decorators in routes
        pass

    @staticmethod
    def get_user(user_id):
        """Get user by ID"""
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")
        return user

    @staticmethod
    def validate_registration_data(first_name, last_name, email, password, confirm_password):
        """Validate registration form data"""
        errors = []
        
        if not first_name or len(first_name.strip()) < 2:
            errors.append("First name must be at least 2 characters")
        
        if not last_name or len(last_name.strip()) < 2:
            errors.append("Last name must be at least 2 characters")
        
        if not email or "@" not in email:
            errors.append("Valid email is required")
        
        if not password or len(password) < 6:
            errors.append("Password must be at least 6 characters")
        
        if password != confirm_password:
            errors.append("Passwords do not match")
        
        return errors
