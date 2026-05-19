from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from typing import Dict, List, Optional, Callable, Awaitable
import logging

logger = logging.getLogger("secmind.scheduler")

scheduler = AsyncIOScheduler(
    jobstores={"default": MemoryJobStore()},
    timezone="Asia/Shanghai",
)


def init_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("任务调度器已启动")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("任务调度器已关闭")


def add_cron_job(
    job_id: str,
    func: Callable[..., Awaitable[None]],
    cron_expr: str,
    **kwargs,
) -> str:
    parts = cron_expr.strip().split()
    if len(parts) != 5:
        raise ValueError(f"无效的 cron 表达式: {cron_expr}")

    trigger = CronTrigger(
        minute=parts[0],
        hour=parts[1],
        day=parts[2],
        month=parts[3],
        day_of_week=parts[4],
        timezone="Asia/Shanghai",
    )

    scheduler.add_job(
        func,
        trigger=trigger,
        id=job_id,
        replace_existing=True,
        **kwargs,
    )
    logger.info(f"已添加定时任务: {job_id} (cron: {cron_expr})")
    return job_id


def remove_job(job_id: str) -> bool:
    try:
        scheduler.remove_job(job_id)
        logger.info(f"已移除定时任务: {job_id}")
        return True
    except Exception:
        return False


def list_jobs() -> List[Dict]:
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    return jobs


def get_job(job_id: str) -> Optional[Dict]:
    job = scheduler.get_job(job_id)
    if job:
        return {
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        }
    return None