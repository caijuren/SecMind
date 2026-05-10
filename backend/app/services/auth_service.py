from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.mock.data import mock_users

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def authenticate_user(email: str, password: str) -> Optional[dict]:
    for user in mock_users:
        if user["email"] == email:
            if verify_password(password, user["hashed_password"]):
                return user
            break
    return None


def get_user_by_email(email: str) -> Optional[dict]:
    for user in mock_users:
        if user["email"] == email:
            return user
    return None


def create_user(email: str, password: str, name: str, **kwargs) -> dict:
    new_id = max(u["id"] for u in mock_users) + 1
    hashed = get_password_hash(password)
    user = {
        "id": new_id,
        "name": name,
        "email": email,
        "hashed_password": hashed,
        "department": kwargs.get("department"),
        "position": kwargs.get("position"),
        "level": kwargs.get("level"),
        "manager": kwargs.get("manager"),
        "is_sensitive": kwargs.get("is_sensitive", False),
        "office": kwargs.get("office"),
        "recent_login_location": kwargs.get("recent_login_location"),
        "is_on_leave": kwargs.get("is_on_leave", False),
        "is_resigned": kwargs.get("is_resigned", False),
        "role": kwargs.get("role", "user"),
    }
    mock_users.append(user)
    return user
