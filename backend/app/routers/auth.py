from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.user import LoginRequest, Token, UserRead, UserCreate
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    decode_access_token,
    get_user_by_email,
    create_user,
)

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    from app.mock.data import mock_users

    for user in mock_users:
        if user["id"] == int(user_id):
            return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="用户不存在",
    )


@router.post("/login", response_model=Token)
def login(request: LoginRequest):
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )
    access_token = create_access_token(data={"sub": str(user["id"])})
    return Token(access_token=access_token)


@router.post("/register", response_model=UserRead)
def register(request: UserCreate):
    existing = get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册",
        )
    user = create_user(
        email=request.email,
        password=request.password,
        name=request.name,
        department=request.department,
        position=request.position,
        level=request.level,
        manager=request.manager,
        is_sensitive=request.is_sensitive,
        office=request.office,
        recent_login_location=request.recent_login_location,
        is_on_leave=request.is_on_leave,
        is_resigned=request.is_resigned,
        role=request.role,
    )
    return user


@router.get("/me", response_model=UserRead)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
