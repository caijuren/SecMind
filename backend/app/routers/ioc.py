from fastapi import APIRouter

from app.services.ioc_service import ioc_service

router = APIRouter(prefix="/ioc", tags=["IOC情报"])


@router.get("/lookup/{ioc_value:path}")
async def lookup_ioc(ioc_value: str, ioc_type: str = "auto"):
    result = await ioc_service.search_ioc(ioc_value, ioc_type)
    return result


@router.post("/batch")
async def batch_lookup(iocs: list[str]):
    results = await ioc_service.batch_lookup(iocs)
    return {"total": len(results), "items": results}


@router.get("/sources")
def list_sources():
    return {"sources": ioc_service.list_sources()}


@router.get("/stats")
def ioc_stats():
    return ioc_service.get_stats()
