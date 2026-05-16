from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.user import (
    LoginRequest,
    Token,
    RegisterResponse,
    UserRead,
    UserCreate,
    RefreshTokenRequest,
    EmailRequest,
    VerifyEmailRequest,
    PhoneRequest,
    PhoneLoginRequest,
)
from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    authenticate_user_with_lockout,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    get_user_by_email,
    create_user,
    generate_verification_token,
    verify_user_email,
)

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user:
        return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="用户不存在",
    )


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user, error = authenticate_user_with_lockout(db, body.email, body.password)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/register", response_model=RegisterResponse)
@limiter.limit("3/minute")
def register(request: Request, body: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册",
        )
    user = create_user(
        db,
        email=body.email,
        password=body.password,
        name=body.name,
        phone=body.phone,
        department=body.department,
        position=body.position,
        level=body.level,
        manager=body.manager,
        is_sensitive=body.is_sensitive,
        office=body.office,
        recent_login_location=body.recent_login_location,
        is_on_leave=body.is_on_leave,
        is_resigned=body.is_resigned,
        role=body.role,
        status=body.status,
        avatar_url=body.avatar_url,
        last_login=body.last_login,
    )
    user.verification_token = generate_verification_token()
    db.commit()
    db.refresh(user)
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return RegisterResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role or "user",
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserRead)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh an access token using a refresh token"""
    payload = decode_refresh_token(body.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.post("/send-verification")
@limiter.limit("3/minute")
def send_verification(request: Request, body: EmailRequest, db: Session = Depends(get_db)):
    """Send email verification (mock - just generates token)"""
    user = get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="邮箱已验证")
    token = generate_verification_token()
    user.verification_token = token
    db.commit()
    return {"message": "验证邮件已发送", "token": token}


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify email with token"""
    user = verify_user_email(db, body.token)
    if not user:
        raise HTTPException(status_code=400, detail="无效的验证令牌")
    return {"message": "邮箱验证成功"}


# In-memory SMS code store (for demo)
_sms_codes: dict[str, str] = {}


@router.post("/send-sms-code")
@limiter.limit("3/minute")
def send_sms_code(request: Request, body: PhoneRequest):
    """Send SMS verification code (mock - returns code for demo)"""
    import random
    code = str(random.randint(100000, 999999))
    _sms_codes[body.phone] = code
    return {"message": "验证码已发送", "code": code}


@router.post("/phone-login", response_model=Token)
def phone_login(body: PhoneLoginRequest, db: Session = Depends(get_db)):
    """Login with phone and SMS verification code"""
    stored = _sms_codes.get(body.phone)
    if not stored or stored != body.sms_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="验证码错误",
        )
    _sms_codes.pop(body.phone, None)
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="该手机号未注册",
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/captcha")
def get_captcha():
    """Generate a simple math captcha (for demo purposes)"""
    import random, hashlib
    a = random.randint(1, 20)
    b = random.randint(1, 20)
    op = random.choice(["+", "-"])
    result = a + b if op == "+" else a - b
    token_input = f"{a}{op}{b}{result}"
    token = hashlib.sha256(token_input.encode()).hexdigest()[:16]
    return {
        "captcha_id": token,
        "question": f"{a} {op} {b} = ?",
        "expected": result,
    }
