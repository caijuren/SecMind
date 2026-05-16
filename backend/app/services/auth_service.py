from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def create_refresh_token(data: dict) -> str:
    """Create a refresh token with 7 day expiry"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and validate a refresh token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if user and verify_password(password, user.hashed_password):
        return user
    return None


def authenticate_user_with_lockout(db: Session, email: str, password: str) -> tuple[Optional[User], Optional[str]]:
    """Authenticate user with account lockout logic.
    Returns (user, error_message).
    If account is locked, returns (None, error_message).
    If credentials are wrong, increments failed attempts and locks if needed.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None, "邮箱或密码错误"
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        return None, f"账户已被锁定，请在{remaining}分钟后重试"
    
    # Clear expired lock
    if user.locked_until and user.locked_until <= datetime.utcnow():
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
    
    if verify_password(password, user.hashed_password):
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
        return user, None
    
    # Failed attempt
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= 5:
        user.locked_until = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    return None, "邮箱或密码错误"


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def generate_verification_token() -> str:
    """Generate a random verification token"""
    import secrets
    return secrets.token_urlsafe(32)


def verify_user_email(db: Session, token: str) -> Optional[User]:
    """Verify a user's email using the verification token"""
    user = db.query(User).filter(User.verification_token == token).first()
    if user:
        user.is_verified = True
        user.verification_token = None
        db.commit()
        db.refresh(user)
    return user


def create_user(db: Session, email: str, password: str, name: str, **kwargs) -> User:
    hashed = get_password_hash(password)
    user = User(
        name=name,
        email=email,
        phone=kwargs.get("phone"),
        hashed_password=hashed,
        department=kwargs.get("department"),
        position=kwargs.get("position"),
        level=kwargs.get("level"),
        manager=kwargs.get("manager"),
        is_sensitive=kwargs.get("is_sensitive", False),
        office=kwargs.get("office"),
        recent_login_location=kwargs.get("recent_login_location"),
        is_on_leave=kwargs.get("is_on_leave", False),
        is_resigned=kwargs.get("is_resigned", False),
        role=kwargs.get("role", "user"),
        status=kwargs.get("status", "active"),
        avatar_url=kwargs.get("avatar_url"),
        last_login=kwargs.get("last_login"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
