from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceRead, DeviceCreate, DeviceUpdate

router = APIRouter(prefix="/devices", tags=["设备管理"])


@router.get("")
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).order_by(Device.id.asc()).all()
    return {"total": len(devices), "items": devices}


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        return device
    raise HTTPException(status_code=404, detail="设备不存在")


@router.post("", response_model=DeviceRead)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    new_device = Device(
        **device.model_dump(),
        last_sync=datetime.utcnow(),
        vendor=device.vendor or device.brand,
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return new_device


@router.put("/{device_id}", response_model=DeviceRead)
def update_device(device_id: int, body: DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(device, key, value)
        device.last_sync = datetime.utcnow()
        if body.brand is not None and body.vendor is None:
            device.vendor = body.brand
        db.commit()
        db.refresh(device)
        return device
    raise HTTPException(status_code=404, detail="设备不存在")
