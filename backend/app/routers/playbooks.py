from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.schemas.playbook import (
    PlaybookCreate,
    PlaybookUpdate,
    PlaybookRead,
    PlaybookListResponse,
    PlaybookStats,
)
from app.services.playbook_service import (
    get_playbooks,
    get_playbook_by_id,
    create_playbook,
    update_playbook,
    delete_playbook,
    get_playbook_stats,
)
from app.database import get_db

router = APIRouter(prefix="/playbooks", tags=["剧本编排"])


@router.get("", response_model=PlaybookListResponse)
def list_playbooks(
    status: Optional[str] = Query(None, description="状态筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    return get_playbooks(db=db, status=status, search=search, skip=skip, limit=limit)


@router.get("/stats", response_model=PlaybookStats)
def playbook_stats(db: Session = Depends(get_db)):
    return get_playbook_stats(db=db)


@router.get("/{playbook_id}", response_model=PlaybookRead)
def get_playbook(playbook_id: int, db: Session = Depends(get_db)):
    playbook = get_playbook_by_id(db, playbook_id)
    if not playbook:
        raise HTTPException(status_code=404, detail="剧本不存在")
    return playbook


@router.post("", response_model=PlaybookRead, status_code=201)
def create_new_playbook(body: PlaybookCreate, db: Session = Depends(get_db)):
    playbook = create_playbook(db, body.model_dump())
    return playbook


@router.put("/{playbook_id}", response_model=PlaybookRead)
def update_existing_playbook(
    playbook_id: int,
    body: PlaybookUpdate,
    db: Session = Depends(get_db),
):
    playbook = update_playbook(db, playbook_id, body.model_dump(exclude_unset=True))
    if not playbook:
        raise HTTPException(status_code=404, detail="剧本不存在")
    return playbook


@router.delete("/{playbook_id}", status_code=204)
def delete_existing_playbook(playbook_id: int, db: Session = Depends(get_db)):
    success = delete_playbook(db, playbook_id)
    if not success:
        raise HTTPException(status_code=404, detail="剧本不存在")


@router.post("/{playbook_id}/toggle", response_model=PlaybookRead)
def toggle_playbook_status(playbook_id: int, db: Session = Depends(get_db)):
    playbook = get_playbook_by_id(db, playbook_id)
    if not playbook:
        raise HTTPException(status_code=404, detail="剧本不存在")
    new_status = "disabled" if playbook.status == "enabled" else "enabled"
    playbook = update_playbook(db, playbook_id, {"status": new_status})
    return playbook
