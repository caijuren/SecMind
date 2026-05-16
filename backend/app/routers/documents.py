from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentRead,
    DocumentSummary,
)
from app.services.document_service import (
    seed_documents,
    get_documents,
    get_document_by_id,
    get_document_by_slug,
    create_document,
    update_document,
    delete_document,
    search_documents,
    get_categories,
)
from app.database import get_db

router = APIRouter(prefix="/docs", tags=["文档管理"])


@router.post("/seed")
def seed_docs(db: Session = Depends(get_db)):
    count = seed_documents(db)
    return {"seeded": count}


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return get_categories(db)


@router.get("/search")
def search_docs(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    results = search_documents(db, q, limit=limit)
    return {"total": len(results), "items": [DocumentSummary.model_validate(d) for d in results]}


@router.get("")
def list_docs(
    category: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = get_documents(db, category=category, status=status, skip=skip, limit=limit)
    return {"total": result["total"], "items": [DocumentSummary.model_validate(d) for d in result["items"]]}


@router.get("/slug/{slug}", response_model=DocumentRead)
def get_doc_by_slug(slug: str, db: Session = Depends(get_db)):
    doc = get_document_by_slug(db, slug)
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    return doc


@router.get("/{doc_id}", response_model=DocumentRead)
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    return doc


@router.post("", response_model=DocumentRead, status_code=201)
def create_doc(body: DocumentCreate, db: Session = Depends(get_db)):
    existing = get_document_by_slug(db, body.slug)
    if existing:
        raise HTTPException(status_code=400, detail="文档标识已存在")
    return create_document(db, body.model_dump())


@router.put("/{doc_id}", response_model=DocumentRead)
def update_doc(doc_id: int, body: DocumentUpdate, db: Session = Depends(get_db)):
    doc = update_document(db, doc_id, body.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_doc(doc_id: int, db: Session = Depends(get_db)):
    if not delete_document(db, doc_id):
        raise HTTPException(status_code=404, detail="文档不存在")
