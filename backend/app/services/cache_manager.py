import json
import logging
import time
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None
    logger.info("redis not installed, using in-memory cache")


class CacheManager:
    def __init__(self):
        self._cache: dict[str, dict] = {}
        self._redis: Optional[aioredis.Redis] = None

        if REDIS_AVAILABLE and settings.REDIS_URL:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True
                )
                logger.info("CacheManager Redis enabled: %s", settings.REDIS_URL)
            except Exception as exc:
                logger.warning(
                    "CacheManager Redis connection failed: %s, using in-memory",
                    exc,
                )

    def _serialize(self, value: Any) -> str:
        return json.dumps(value, default=str)

    def _deserialize(self, data: str) -> Any:
        return json.loads(data)

    async def get(self, key: str) -> Optional[Any]:
        if self._redis:
            try:
                data = await self._redis.get(key)
                if data:
                    return self._deserialize(data)
            except Exception as exc:
                logger.warning("CacheManager Redis get failed for %s: %s", key, exc)

        entry = self._cache.get(key)
        if entry and time.time() < entry["expires_at"]:
            return entry["data"]
        if entry:
            del self._cache[key]
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        if self._redis:
            try:
                await self._redis.setex(key, ttl, self._serialize(value))
                return
            except Exception as exc:
                logger.warning("CacheManager Redis set failed for %s: %s", key, exc)

        self._cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl,
        }

    async def delete(self, key: str) -> None:
        if self._redis:
            try:
                await self._redis.delete(key)
            except Exception as exc:
                logger.warning("CacheManager Redis delete failed: %s", exc)
        self._cache.pop(key, None)

    async def exists(self, key: str) -> bool:
        if self._redis:
            try:
                return await self._redis.exists(key) > 0
            except Exception as exc:
                logger.warning("CacheManager Redis exists failed: %s", exc)

        entry = self._cache.get(key)
        if entry and time.time() < entry["expires_at"]:
            return True
        if entry:
            del self._cache[key]
        return False

    async def increment(self, key: str, amount: int = 1) -> int:
        if self._redis:
            try:
                return await self._redis.incrby(key, amount)
            except Exception as exc:
                logger.warning("CacheManager Redis increment failed: %s", exc)

        entry = self._cache.get(key)
        if entry and time.time() < entry["expires_at"]:
            if isinstance(entry["data"], (int, float)):
                entry["data"] += amount
                return entry["data"]

        value = amount
        self._cache[key] = {
            "data": value,
            "expires_at": time.time() + 86400,
        }
        return value

    async def expire(self, key: str, ttl: int) -> bool:
        if self._redis:
            try:
                return await self._redis.expire(key, ttl)
            except Exception as exc:
                logger.warning("CacheManager Redis expire failed: %s", exc)

        entry = self._cache.get(key)
        if entry:
            entry["expires_at"] = time.time() + ttl
            return True
        return False

    async def close(self):
        if self._redis:
            try:
                await self._redis.aclose()
            except Exception as exc:
                logger.warning("CacheManager Redis close failed: %s", exc)
            self._redis = None


cache_manager = CacheManager()