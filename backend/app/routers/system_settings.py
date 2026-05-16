from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.system_setting import SystemSetting
from app.schemas.system_setting import SystemSettingRead, SystemSettingUpdate

router = APIRouter(prefix="/system-settings", tags=["系统设置"])


def get_or_create_settings(db: Session) -> SystemSetting:
    settings = db.query(SystemSetting).first()
    if settings:
        return settings

    settings = SystemSetting()
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("", response_model=SystemSettingRead)
def read_settings(db: Session = Depends(get_db)):
    return get_or_create_settings(db)


@router.put("", response_model=SystemSettingRead)
def update_settings(body: SystemSettingUpdate, db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    for key, value in body.model_dump().items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
