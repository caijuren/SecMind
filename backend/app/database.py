import time
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from app.config import settings

logger = logging.getLogger("secmind.db")

_IS_POSTGRES = settings.DATABASE_URL.startswith("postgresql")

_engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 3600,
    "echo": False,
}

if _IS_POSTGRES:
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 40
else:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if _IS_POSTGRES:
        return
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SLOW_QUERY_THRESHOLD_MS = 200


@contextmanager
def query_timer(description: str = ""):
    start = time.perf_counter()
    yield
    elapsed_ms = (time.perf_counter() - start) * 1000
    if elapsed_ms > SLOW_QUERY_THRESHOLD_MS:
        logger.warning(
            f"Slow query ({elapsed_ms:.1f}ms): {description}"
        )


def get_db_with_timing() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        original_execute = db.execute

        def timed_execute(statement, *args, **kwargs):
            start = time.perf_counter()
            result = original_execute(statement, *args, **kwargs)
            elapsed_ms = (time.perf_counter() - start) * 1000
            if elapsed_ms > SLOW_QUERY_THRESHOLD_MS:
                stmt_str = str(statement)
                if len(stmt_str) > 200:
                    stmt_str = stmt_str[:200] + "..."
                logger.warning(
                    f"Slow query ({elapsed_ms:.1f}ms): {stmt_str}"
                )
            return result

        db.execute = timed_execute
        yield db
    finally:
        db.close()