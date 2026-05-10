from fastapi import APIRouter, HTTPException

from app.schemas.device import DeviceRead, DeviceCreate, DeviceUpdate
from app.mock.data import mock_devices

router = APIRouter(prefix="/devices", tags=["设备管理"])


@router.get("")
def list_devices():
    return {"total": len(mock_devices), "items": mock_devices}


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(device_id: int):
    for device in mock_devices:
        if device["id"] == device_id:
            return device
    raise HTTPException(status_code=404, detail="设备不存在")


@router.post("", response_model=DeviceRead)
def create_device(device: DeviceCreate):
    new_id = max(d["id"] for d in mock_devices) + 1
    new_device = {**device.model_dump(), "id": new_id, "last_sync": None}
    mock_devices.append(new_device)
    return new_device


@router.put("/{device_id}", response_model=DeviceRead)
def update_device(device_id: int, body: DeviceUpdate):
    for device in mock_devices:
        if device["id"] == device_id:
            update_data = body.model_dump(exclude_unset=True)
            device.update(update_data)
            return device
    raise HTTPException(status_code=404, detail="设备不存在")
