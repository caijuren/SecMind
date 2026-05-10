from fastapi import APIRouter, HTTPException

from app.schemas.itsm import ITSMTicketRead, ITSMTicketCreate, ITSMTicketUpdate
from app.mock.data import mock_tickets

router = APIRouter(prefix="/itsm", tags=["ITSM工单"])


@router.get("")
def list_tickets():
    return {"total": len(mock_tickets), "items": mock_tickets}


@router.get("/{ticket_id}", response_model=ITSMTicketRead)
def get_ticket(ticket_id: int):
    for ticket in mock_tickets:
        if ticket["id"] == ticket_id:
            return ticket
    raise HTTPException(status_code=404, detail="工单不存在")


@router.post("", response_model=ITSMTicketRead)
def create_ticket(ticket: ITSMTicketCreate):
    from datetime import datetime

    new_id = max(t["id"] for t in mock_tickets) + 1
    new_ticket = {
        **ticket.model_dump(),
        "id": new_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "resolution": None,
    }
    mock_tickets.append(new_ticket)
    return new_ticket


@router.put("/{ticket_id}", response_model=ITSMTicketRead)
def update_ticket(ticket_id: int, body: ITSMTicketUpdate):
    from datetime import datetime

    for ticket in mock_tickets:
        if ticket["id"] == ticket_id:
            update_data = body.model_dump(exclude_unset=True)
            ticket.update(update_data)
            ticket["updated_at"] = datetime.now()
            return ticket
    raise HTTPException(status_code=404, detail="工单不存在")
