from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PermissionRead(BaseModel):
    id: int
    resource: str
    action: str
    description: Optional[str] = None

    @property
    def code(self) -> str:
        return f"{self.resource}:{self.action}"

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleRead(RoleBase):
    id: int
    is_system: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    permissions: Optional[List[PermissionRead]] = []

    class Config:
        from_attributes = True


class UserRoleAssign(BaseModel):
    role_ids: List[int]


class UserPermissionsRead(BaseModel):
    user_id: int
    roles: List[str]
    permissions: List[str]
