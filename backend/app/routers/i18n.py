from fastapi import APIRouter

router = APIRouter(prefix="/i18n", tags=["国际化"])

SUPPORTED_LOCALES = [
    {"code": "zh-CN", "name": "简体中文", "flag": "中"},
    {"code": "en", "name": "English", "flag": "EN"},
]


@router.get("/locales")
def get_locales():
    return {"locales": SUPPORTED_LOCALES, "default": "zh-CN"}
