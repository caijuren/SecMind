from fastapi import APIRouter, HTTPException, Depends, status, Request
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
    decode_refresh_token,
    get_user_by_email,
    create_user,
    generate_verification_token,
    verify_user_email,
)
from app.services.permissions import get_current_user
from app.services.audit_service import record_audit
from app.dependencies import get_current_tenant_id

router = APIRouter(prefix="/auth", tags=["认证"])
limiter = Limiter(key_func=get_remote_address)


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
    record_audit(
        db=db,
        tenant_id=str(getattr(user, "tenant_id", "default")),
        action="user_login",
        user_id=user.id,
        user_name=user.name,
        resource_type="auth",
        detail=f"用户 {user.name} 登录成功",
        ip_address=request.client.host if request.client else None,
    )
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
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserRead)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
        )
    user_id = payload.get("sub")
    token_version = payload.get("tv", 0)
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    if token_version != user.token_version:
        user.token_version = 0
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌已被使用，请重新登录",
        )

    user.token_version += 1
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "tv": user.token_version})
    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.token_version = 0
    db.commit()
    return {"message": "已登出"}


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
    return {"message": "验证邮件已发送"}


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify email with token"""
    user = verify_user_email(db, body.token)
    if not user:
        raise HTTPException(status_code=400, detail="无效的验证令牌")
    return {"message": "邮箱验证成功"}


# In-memory SMS code store (for demo, with 5-minute TTL)
_sms_codes: dict[str, dict] = {}


@router.post("/send-sms-code")
@limiter.limit("3/minute")
def send_sms_code(request: Request, body: PhoneRequest):
    """Send SMS verification code (mock - for demo)"""
    import random, time
    code = str(random.randint(100000, 999999))
    _sms_codes[body.phone] = {"code": code, "expires_at": time.time() + 300}
    return {"message": "验证码已发送"}


@router.post("/phone-login", response_model=Token)
def phone_login(body: PhoneLoginRequest, db: Session = Depends(get_db)):
    """Login with phone and SMS verification code"""
    import time
    stored = _sms_codes.get(body.phone)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先获取验证码",
        )
    if time.time() > stored["expires_at"]:
        _sms_codes.pop(body.phone, None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="验证码已过期",
        )
    if stored["code"] != body.sms_code:
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


# In-memory captcha store
_captcha_store: dict[str, int] = {}

@router.get("/captcha")
def get_captcha():
    """Generate a simple math captcha"""
    import random, hashlib
    a = random.randint(1, 20)
    b = random.randint(1, 20)
    op = random.choice(["+", "-"])
    result = a + b if op == "+" else a - b
    token_input = f"{a}{op}{b}{result}"
    captcha_id = hashlib.sha256(token_input.encode()).hexdigest()[:16]
    _captcha_store[captcha_id] = result
    return {
        "captcha_id": captcha_id,
        "question": f"{a} {op} {b} = ?",
    }


@router.post("/verify-captcha")
def verify_captcha(body: dict):
    captcha_id = body.get("captcha_id")
    answer = body.get("answer")
    if not captcha_id or answer is None:
        raise HTTPException(status_code=400, detail="缺少验证码参数")
    expected = _captcha_store.pop(captcha_id, None)
    if expected is None:
        raise HTTPException(status_code=400, detail="验证码已过期或无效")
    if int(answer) != expected:
        raise HTTPException(status_code=400, detail="验证码错误")
    return {"message": "验证通过"}
