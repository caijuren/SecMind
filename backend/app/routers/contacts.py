from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session

from app.schemas.contact import ContactCreate, ContactRead
from app.models.contact import ContactSubmission
from app.database import get_db

router = APIRouter(prefix="/contacts", tags=["联系表单"])


@router.post("", response_model=ContactRead, status_code=201)
def submit_contact(body: ContactCreate, db: Session = Depends(get_db)):
    submission = ContactSubmission(
        name=body.name,
        company=body.company,
        email=body.email,
        phone=body.phone,
        message=body.message,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[ContactRead])
def list_contacts(
    status: Optional[str] = Query(None, description="状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(ContactSubmission)
    if status:
        query = query.filter(ContactSubmission.status == status)
    return query.order_by(ContactSubmission.id.desc()).offset(skip).limit(limit).all()
