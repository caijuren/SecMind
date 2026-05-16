from pydantic import BaseModel


class SystemSettingBase(BaseModel):
    system_name: str
    session_timeout: int
    ip_whitelist: str
    log_retention: int
    mfa_enabled: bool
    password_min_length: int
    ai_model: str
    ai_temperature: float
    ai_max_tokens: int
    rag_enabled: bool


class SystemSettingUpdate(SystemSettingBase):
    pass


class SystemSettingRead(SystemSettingBase):
    id: int

    class Config:
        from_attributes = True
