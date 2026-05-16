from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    level: Optional[str] = None
    manager: Optional[str] = None
    is_sensitive: Optional[bool] = False
    office: Optional[str] = None
    recent_login_location: Optional[str] = None
    is_on_leave: Optional[bool] = False
    is_resigned: Optional[bool] = False
    email: Optional[str] = None
    role: Optional[str] = "user"
    status: Optional[str] = "active"
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    level: Optional[str] = None
    manager: Optional[str] = None
    is_sensitive: Optional[bool] = None
    office: Optional[str] = None
    recent_login_location: Optional[str] = None
    is_on_leave: Optional[bool] = None
    is_resigned: Optional[bool] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class RegisterResponse(Token):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "user"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class EmailRequest(BaseModel):
    email: str


class VerifyEmailRequest(BaseModel):
    token: str


class PhoneRequest(BaseModel):
    phone: str


class PhoneLoginRequest(BaseModel):
    phone: str
    sms_code: str
