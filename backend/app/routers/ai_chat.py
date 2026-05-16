from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.ai_chat import (
    ChatSessionCreate,
    ChatSessionRead,
    ChatMessageCreate,
    ChatMessageRead,
    ChatSessionDetail,
    ReportCreate,
    ReportUpdate,
    ReportRead,
    ReportListResponse,
)
from typing import List as TypingList
from pydantic import BaseModel


class ChatSessionListResponse(BaseModel):
    total: int
    items: TypingList[ChatSessionRead]
from app.services.ai_chat_service import (
    create_session,
    get_sessions,
    get_session_detail,
    delete_session,
    add_message,
    process_ai_response,
    generate_investigation_report,
    AI_TOOLS,
    get_reports,
    get_report_by_id,
    create_report,
    update_report,
    delete_report,
)
from app.database import get_db
from app.services.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai-chat", tags=["AI对话"])


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_sessions(db, current_user.id, skip=skip, limit=limit)


@router.post("/sessions", response_model=ChatSessionRead, status_code=201)
def create_new_session(body: ChatSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_session(db, current_user.id, title=body.title or "新对话", alert_id=body.alert_id)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = get_session_detail(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="对话不存在")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
def remove_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not delete_session(db, session_id):
        raise HTTPException(status_code=404, detail="对话不存在")


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageRead)
async def send_message(session_id: int, body: ChatMessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = get_session_detail(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="对话不存在")
    user_msg = add_message(db, session_id, "user", body.content)
    ai_msg = await process_ai_response(db, session_id, body.content)
    return ai_msg


class ReportResponse(BaseModel):
    session_id: int
    report: str


@router.post("/sessions/{session_id}/report", response_model=ReportResponse)
async def generate_session_report(session_id: int, db: Session = Depends(get_db)):
    session = get_session_detail(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="对话不存在")
    report = await generate_investigation_report(db, session_id)
    return ReportResponse(session_id=session_id, report=report)


@router.get("/tools")
def list_tools():
    return {"tools": AI_TOOLS}


@router.get("/reports", response_model=ReportListResponse)
def list_reports(report_type: Optional[str] = Query(None), status: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return get_reports(db, report_type=report_type, status=status, skip=skip, limit=limit)


@router.get("/reports/{report_id}", response_model=ReportRead)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report


@router.post("/reports", response_model=ReportRead, status_code=201)
def create_new_report(body: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = body.model_dump()
    data["created_by"] = current_user.name
    return create_report(db, data)


@router.put("/reports/{report_id}", response_model=ReportRead)
def update_existing_report(report_id: int, body: ReportUpdate, db: Session = Depends(get_db)):
    report = update_report(db, report_id, body.model_dump(exclude_unset=True))
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report


@router.delete("/reports/{report_id}", status_code=204)
def remove_report(report_id: int, db: Session = Depends(get_db)):
    if not delete_report(db, report_id):
        raise HTTPException(status_code=404, detail="报告不存在")
