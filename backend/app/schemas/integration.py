from typing import List, Optional

from pydantic import BaseModel


class IntegrationAppBase(BaseModel):
    slug: str
    name: str
    description: str
    category: Optional[str] = None
    status: str = "disconnected"
    color: Optional[str] = None
    last_sync: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    sync_frequency: str = "15min"
    source: str = "integrated"


class IntegrationAppCreate(IntegrationAppBase):
    pass


class IntegrationAppUpdate(BaseModel):
    status: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    sync_frequency: Optional[str] = None
    last_sync: Optional[str] = None


class IntegrationAppRead(IntegrationAppBase):
    id: int

    class Config:
        from_attributes = True


class WebhookBase(BaseModel):
    name: str
    url: str
    events: List[str]
    active: bool = True
    created_at: str


class WebhookCreate(WebhookBase):
    pass


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None


class WebhookRead(WebhookBase):
    id: int

    class Config:
        from_attributes = True
