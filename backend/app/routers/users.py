from fastapi import APIRouter, HTTPException, Depends

from app.schemas.user import UserRead, UserUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("")
def list_users():
    from app.mock.data import mock_users

    safe_users = []
    for u in mock_users:
        safe = {k: v for k, v in u.items() if k != "hashed_password"}
        safe_users.append(safe)
    return {"total": len(safe_users), "items": safe_users}


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    from app.mock.data import mock_users

    for user in mock_users:
        if user["id"] == user_id:
            return user
    raise HTTPException(status_code=404, detail="用户不存在")


@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, body: UserUpdate):
    from app.mock.data import mock_users

    for user in mock_users:
        if user["id"] == user_id:
            update_data = body.model_dump(exclude_unset=True)
            user.update(update_data)
            return user
    raise HTTPException(status_code=404, detail="用户不存在")
