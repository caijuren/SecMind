import logging
from collections import defaultdict
from datetime import date, timedelta
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None
    logger.info("redis not installed, using in-memory token usage tracking")

QUOTA_TIERS: dict[str, int] = {
    "free": 100_000,
    "starter": 500_000,
    "professional": 5_000_000,
    "enterprise": 50_000_000,
}

DEFAULT_PLAN = "free"
REDIS_KEY_PREFIX = "token_usage"
REDIS_TTL = 48 * 3600


class TokenMonitor:
    """LLM Token 用量监控与配额限制

    支持按租户和用户维度追踪每日 Token 消耗量，
    提供配额检查、用量记录和统计查询功能。
    Redis 可用时自动使用 Redis 持久化存储，否则降级为内存存储。
    """

    def __init__(self):
        self._tenant_plans: dict[str, str] = {}
        self._usage: dict[str, dict[str, int]] = defaultdict(
            lambda: {"total": 0, "input": 0, "output": 0}
        )
        self._redis: Optional[aioredis.Redis] = None

        if REDIS_AVAILABLE and settings.REDIS_URL:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True
                )
                logger.info("TokenMonitor Redis enabled: %s", settings.REDIS_URL)
            except Exception as exc:
                logger.warning(
                    "TokenMonitor Redis connection failed: %s, using in-memory",
                    exc,
                )

    @staticmethod
    def _today_key(tenant_id: str) -> str:
        today = date.today().isoformat()
        return f"{REDIS_KEY_PREFIX}:{today}:{tenant_id}"

    @staticmethod
    def _yesterday_key(tenant_id: str) -> str:
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        return f"{REDIS_KEY_PREFIX}:{yesterday}:{tenant_id}"

    def set_tenant_plan(self, tenant_id: str, plan: str) -> None:
        """设置租户的配额方案"""
        plan = plan.lower()
        if plan not in QUOTA_TIERS:
            logger.warning(
                "Unknown plan '%s' for tenant %s, defaulting to '%s'",
                plan,
                tenant_id,
                DEFAULT_PLAN,
            )
            plan = DEFAULT_PLAN
        self._tenant_plans[tenant_id] = plan

    def get_tenant_plan(self, tenant_id: str) -> str:
        """获取租户当前配额方案，未设置时返回默认方案"""
        return self._tenant_plans.get(tenant_id, DEFAULT_PLAN)

    def get_tenant_limits(self, tenant_id: str) -> dict:
        """获取租户的每日配额限制

        Returns:
            dict: 包含 tenant_id, plan, daily_limit
        """
        plan = self.get_tenant_plan(tenant_id)
        daily_limit = QUOTA_TIERS[plan]
        return {
            "tenant_id": tenant_id,
            "plan": plan,
            "daily_limit": daily_limit,
        }

    async def _get_usage_from_redis(self, key: str) -> dict[str, int]:
        try:
            data = await self._redis.hgetall(key)
            if data:
                return {
                    "total": int(data.get("total", 0)),
                    "input": int(data.get("input", 0)),
                    "output": int(data.get("output", 0)),
                }
        except Exception as exc:
            logger.warning("Redis hgetall failed for %s: %s", key, exc)
        return {"total": 0, "input": 0, "output": 0}

    async def _incr_usage_in_redis(
        self, key: str, input_tokens: int, output_tokens: int
    ) -> None:
        total = input_tokens + output_tokens
        try:
            pipe = self._redis.pipeline()
            pipe.hincrby(key, "total", total)
            pipe.hincrby(key, "input", input_tokens)
            pipe.hincrby(key, "output", output_tokens)
            pipe.expire(key, REDIS_TTL)
            await pipe.execute()
        except Exception as exc:
            logger.warning("Redis usage increment failed for %s: %s", key, exc)

    async def check_quota(
        self, tenant_id: str, user_id: str, tokens_to_use: int
    ) -> bool:
        """检查租户是否有足够的 Token 配额完成本次操作

        Args:
            tenant_id: 租户标识
            user_id: 用户标识
            tokens_to_use: 本次预计消耗的 Token 数量

        Returns:
            bool: True 表示配额充足，False 表示配额不足
        """
        plan = self.get_tenant_plan(tenant_id)
        daily_limit = QUOTA_TIERS[plan]
        key = self._today_key(tenant_id)

        if self._redis:
            usage = await self._get_usage_from_redis(key)
            current_total = usage["total"]
        else:
            current_total = self._usage[key]["total"]

        allowed = (current_total + tokens_to_use) <= daily_limit
        if not allowed:
            logger.warning(
                "Token quota exceeded: tenant=%s user=%s plan=%s used=%d limit=%d requested=%d",
                tenant_id,
                user_id,
                plan,
                current_total,
                daily_limit,
                tokens_to_use,
            )
        return allowed

    async def record_usage(
        self,
        tenant_id: str,
        user_id: str,
        input_tokens: int,
        output_tokens: int,
        model_name: str,
    ) -> None:
        """记录一次 LLM 调用的 Token 消耗

        Args:
            tenant_id: 租户标识
            user_id: 用户标识
            input_tokens: 输入 Token 数量
            output_tokens: 输出 Token 数量
            model_name: 使用的模型名称
        """
        key = self._today_key(tenant_id)

        if self._redis:
            await self._incr_usage_in_redis(key, input_tokens, output_tokens)
        else:
            total = input_tokens + output_tokens
            self._usage[key]["total"] += total
            self._usage[key]["input"] += input_tokens
            self._usage[key]["output"] += output_tokens

        logger.info(
            "Token usage recorded: tenant=%s user=%s model=%s input=%d output=%d total=%d",
            tenant_id,
            user_id,
            model_name,
            input_tokens,
            output_tokens,
            input_tokens + output_tokens,
        )

    async def get_usage_stats(self, tenant_id: str) -> dict:
        """获取租户当日用量统计

        Returns:
            dict: 包含 tenant_id, plan, daily_limit, used_total,
                  used_input, used_output, remaining, usage_percent
        """
        plan = self.get_tenant_plan(tenant_id)
        daily_limit = QUOTA_TIERS[plan]
        key = self._today_key(tenant_id)

        if self._redis:
            usage = await self._get_usage_from_redis(key)
        else:
            usage_data = self._usage.get(key, {"total": 0, "input": 0, "output": 0})
            usage = dict(usage_data)

        remaining = max(0, daily_limit - usage["total"])
        usage_percent = (
            round(usage["total"] / daily_limit * 100, 2) if daily_limit > 0 else 0.0
        )

        return {
            "tenant_id": tenant_id,
            "plan": plan,
            "daily_limit": daily_limit,
            "used_total": usage["total"],
            "used_input": usage["input"],
            "used_output": usage["output"],
            "remaining": remaining,
            "usage_percent": usage_percent,
        }

    async def get_yesterday_usage(self, tenant_id: str) -> dict[str, int]:
        """获取租户昨日用量（仅 Redis 模式下可用，内存模式返回空）"""
        if self._redis:
            key = self._yesterday_key(tenant_id)
            return await self._get_usage_from_redis(key)
        return {"total": 0, "input": 0, "output": 0}

    async def close(self):
        """关闭 Redis 连接"""
        if self._redis:
            try:
                await self._redis.aclose()
            except Exception as exc:
                logger.warning("TokenMonitor Redis close failed: %s", exc)
            self._redis = None


token_monitor = TokenMonitor()


def get_token_monitor() -> TokenMonitor:
    """FastAPI 依赖注入：返回 TokenMonitor 单例实例"""
    return token_monitor