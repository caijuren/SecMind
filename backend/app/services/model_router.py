import asyncio
import hashlib
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

import httpx

from app.config import settings
from app.services.cache_manager import cache_manager
from app.services.token_monitor import token_monitor

logger = logging.getLogger(__name__)


@dataclass
class ModelUsageStats:
    calls: int = 0
    successes: int = 0
    failures: int = 0
    total_latency_ms: float = 0.0
    total_cost: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0


@dataclass
class ModelHealthStatus:
    healthy: bool = True
    consecutive_failures: int = 0
    total_errors: int = 0
    last_error_time: float = 0.0
    last_success_time: float = 0.0
    last_checked_time: float = 0.0
    error_rate: float = 0.0


class ModelRouter:
    """AI多模型路由 - 根据任务类型智能选择最优模型"""

    MODELS: dict[str, dict] = {
        "gpt-4o": {
            "provider": "openai",
            "capabilities": ["reasoning", "analysis", "writing"],
            "cost_per_1k_tokens": 0.03,
            "max_tokens": 128000,
            "latency_ms": 2000,
            "quality_score": 0.95,
        },
        "gpt-4o-mini": {
            "provider": "openai",
            "capabilities": ["classification", "extraction", "summarization"],
            "cost_per_1k_tokens": 0.005,
            "max_tokens": 128000,
            "latency_ms": 800,
            "quality_score": 0.85,
        },
        "claude-sonnet-4-20250514": {
            "provider": "anthropic",
            "capabilities": ["reasoning", "analysis", "writing", "coding"],
            "cost_per_1k_tokens": 0.015,
            "max_tokens": 200000,
            "latency_ms": 1500,
            "quality_score": 0.93,
        },
        "deepseek-chat": {
            "provider": "deepseek",
            "capabilities": ["reasoning", "analysis", "coding"],
            "cost_per_1k_tokens": 0.002,
            "max_tokens": 64000,
            "latency_ms": 1200,
            "quality_score": 0.88,
        },
        "qwen-max": {
            "provider": "aliyun",
            "capabilities": ["reasoning", "analysis", "chinese"],
            "cost_per_1k_tokens": 0.008,
            "max_tokens": 32000,
            "latency_ms": 1000,
            "quality_score": 0.87,
        },
    }

    TASK_MODEL_PREFERENCE: dict[str, list[str]] = {
        "threat_analysis": ["gpt-4o", "claude-sonnet-4-20250514", "deepseek-chat"],
        "alert_triage": ["gpt-4o-mini", "qwen-max", "deepseek-chat"],
        "incident_summary": ["gpt-4o-mini", "qwen-max"],
        "playbook_generation": ["gpt-4o", "claude-sonnet-4-20250514"],
        "ioc_enrichment": ["gpt-4o-mini", "deepseek-chat"],
        "report_generation": ["gpt-4o", "claude-sonnet-4-20250514", "qwen-max"],
        "code_analysis": ["deepseek-chat", "claude-sonnet-4-20250514"],
    }

    _PROVIDER_DEFAULT_URLS: dict[str, str] = {
        "openai": "https://api.openai.com/v1",
        "anthropic": "https://api.anthropic.com",
        "deepseek": "https://api.deepseek.com/v1",
        "aliyun": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    }

    def __init__(self):
        self._stats: dict[str, ModelUsageStats] = defaultdict(ModelUsageStats)
        self._clients: dict[str, httpx.AsyncClient] = {}
        self._health: dict[str, ModelHealthStatus] = defaultdict(ModelHealthStatus)
        self._budgets: dict[str, float] = {}
        self._unhealthy_retry_seconds: float = 300.0

    def _get_provider_api_key(self, provider: str) -> str:
        mapping = {
            "openai": settings.OPENAI_API_KEY or settings.LLM_API_KEY,
            "anthropic": settings.ANTHROPIC_API_KEY,
            "deepseek": settings.DEEPSEEK_API_KEY,
            "aliyun": settings.ALIYUN_API_KEY,
        }
        return mapping.get(provider, settings.LLM_API_KEY)

    def _get_provider_base_url(self, provider: str) -> str:
        mapping = {
            "openai": settings.OPENAI_BASE_URL,
            "anthropic": settings.ANTHROPIC_BASE_URL,
            "deepseek": settings.DEEPSEEK_BASE_URL,
            "aliyun": settings.ALIYUN_BASE_URL,
        }
        return mapping.get(provider, settings.LLM_BASE_URL).rstrip("/")

    async def _get_client(self, provider: str) -> httpx.AsyncClient:
        if provider in self._clients and not self._clients[provider].is_closed:
            return self._clients[provider]

        api_key = self._get_provider_api_key(provider)
        base_url = self._get_provider_base_url(provider)

        if provider == "anthropic":
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
        else:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

        client = httpx.AsyncClient(
            base_url=base_url,
            timeout=httpx.Timeout(60.0, connect=10.0),
            headers=headers,
        )
        self._clients[provider] = client
        return client

    def select_model(self, task_type: str, priority: str = "balanced") -> str:
        """选择最优模型

        priority: "quality" | "cost" | "speed" | "balanced"
        """
        candidates = self.TASK_MODEL_PREFERENCE.get(task_type, list(self.MODELS.keys()))
        candidates = [m for m in candidates if m in self.MODELS]
        if not candidates:
            candidates = list(self.MODELS.keys())

        if priority == "quality":
            return max(candidates, key=lambda m: self.MODELS[m]["quality_score"])
        elif priority == "cost":
            return min(candidates, key=lambda m: self.MODELS[m]["cost_per_1k_tokens"])
        elif priority == "speed":
            return min(candidates, key=lambda m: self.MODELS[m]["latency_ms"])
        else:
            def _balanced_score(m: str) -> float:
                info = self.MODELS[m]
                q = info["quality_score"]
                c = 1.0 - min(info["cost_per_1k_tokens"] / 0.03, 1.0)
                s = 1.0 - min(info["latency_ms"] / 3000.0, 1.0)
                return 0.5 * q + 0.25 * c + 0.25 * s
            return max(candidates, key=_balanced_score)

    def _get_ordered_candidates(self, task_type: str, priority: str = "balanced") -> list[str]:
        candidates = list(self.TASK_MODEL_PREFERENCE.get(task_type, list(self.MODELS.keys())))
        candidates = [m for m in candidates if m in self.MODELS]
        if not candidates:
            candidates = list(self.MODELS.keys())
        candidates = [m for m in candidates if self._should_retry_model(m)]
        if not candidates:
            candidates = list(self.MODELS.keys())
        primary = self.select_model(task_type, priority)
        reordered = [primary]
        for m in candidates:
            if m != primary:
                reordered.append(m)
        for m in self.MODELS:
            if m not in reordered:
                reordered.append(m)
        return reordered

    @staticmethod
    def _hash_prompt(task_type: str, prompt: str) -> str:
        raw = f"{task_type}:{prompt}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    async def get_cached_response(self, task_type: str, prompt_hash: str) -> Optional[dict]:
        cache_key = f"llm_cache:{task_type}:{prompt_hash}"
        return await cache_manager.get(cache_key)

    async def cache_response(
        self, task_type: str, prompt_hash: str, response: dict, ttl: int = 3600
    ) -> None:
        cache_key = f"llm_cache:{task_type}:{prompt_hash}"
        await cache_manager.set(cache_key, response, ttl=ttl)

    @staticmethod
    def classify_task(prompt_or_messages) -> dict:
        if isinstance(prompt_or_messages, list):
            prompt = " ".join(
                m.get("content", "") for m in prompt_or_messages
                if isinstance(m, dict) and m.get("content")
            )
        else:
            prompt = str(prompt_or_messages)

        prompt_lower = prompt.lower()

        threat_keywords = [
            "威胁", "threat", "攻击", "attack", "恶意", "malware", "c2", "钓鱼",
            "phishing", "apt", "漏洞", "exploit", "入侵", "breach", "ransomware",
        ]
        alert_keywords = [
            "告警", "alert", "警报", "误报", "false positive", "触发规则",
            "rule triggered", "异常检测", "anomaly", "检测到", "detected",
        ]
        incident_keywords = [
            "事件", "incident", "应急", "响应", "response", "总结", "summary",
            "复盘", "postmortem", "发生了什么", "what happened",
        ]
        playbook_keywords = [
            "预案", "playbook", "处置", "流程", "workflow", "soar", "自动化",
            "automation", "操作手册", "runbook", "操作步骤",
        ]
        ioc_keywords = [
            "ioc", "指标", "indicator", "情报", "intel", "ip", "域名", "domain",
            "hash", "md5", "sha", "url", "富化", "enrich",
        ]
        report_keywords = [
            "报告", "report", "报表", "统计", "statistics", "月度", "monthly",
            "周报", "weekly", "日报", "daily", "汇总", "dashboard",
        ]
        code_keywords = [
            "代码", "code", "脚本", "script", "分析代码", "code analysis",
            "review", "审计", "audit", "函数", "function", "bug", "漏洞扫描",
        ]

        classifiers = [
            ("threat_analysis", threat_keywords),
            ("alert_triage", alert_keywords),
            ("incident_summary", incident_keywords),
            ("playbook_generation", playbook_keywords),
            ("ioc_enrichment", ioc_keywords),
            ("report_generation", report_keywords),
            ("code_analysis", code_keywords),
        ]

        best_task_type = "threat_analysis"
        best_score = 0

        for task_type, keywords in classifiers:
            score = sum(1 for kw in keywords if kw in prompt_lower)
            if score > best_score:
                best_score = score
                best_task_type = task_type

        max_possible = max(len(keywords) for _, keywords in classifiers)
        confidence = min(best_score / max(max_possible * 0.3, 1), 1.0) if best_score > 0 else 0.3

        return {
            "task_type": best_task_type,
            "confidence": round(confidence, 2),
            "matched_keywords": best_score,
        }

    def estimate_cost(
        self, model_name: str, input_tokens: int, output_tokens: int
    ) -> float:
        model_info = self.MODELS.get(model_name)
        if not model_info:
            return 0.0
        cost_per_1k = model_info["cost_per_1k_tokens"]
        return round((input_tokens + output_tokens) / 1000 * cost_per_1k, 6)

    def check_budget(self, tenant_id: str) -> dict:
        tenant_key = str(tenant_id)
        spent = self._budgets.get(tenant_key, 0.0)
        budget_limit = 50.0

        return {
            "tenant_id": tenant_key,
            "budget_limit": budget_limit,
            "spent": round(spent, 4),
            "remaining": round(budget_limit - spent, 4),
            "is_tight": (budget_limit - spent) < budget_limit * 0.2,
        }

    def record_spend(self, tenant_id: str, amount: float) -> None:
        tenant_key = str(tenant_id)
        self._budgets[tenant_key] = self._budgets.get(tenant_key, 0.0) + amount

    def _get_cost_effective_model(
        self, task_type: str, candidates: list[str]
    ) -> str:
        budget_models = sorted(
            candidates,
            key=lambda m: self.MODELS[m]["cost_per_1k_tokens"],
        )
        for model in budget_models:
            if model in self.MODELS and self.MODELS[model]["quality_score"] >= 0.80:
                return model
        return budget_models[0] if budget_models else candidates[0]

    async def check_model_health(self, model_name: str) -> bool:
        if model_name not in self.MODELS:
            return False

        model_info = self.MODELS[model_name]
        provider = model_info["provider"]
        api_key = self._get_provider_api_key(provider)
        if not api_key:
            self._mark_model_unhealthy(model_name)
            return False

        health = self._health[model_name]
        health.last_checked_time = time.time()

        try:
            client = await self._get_client(provider)
            if provider == "anthropic":
                resp = await client.post(
                    "v1/messages",
                    json={
                        "model": model_name,
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "ping"}],
                    },
                    timeout=httpx.Timeout(15.0, connect=5.0),
                )
            else:
                resp = await client.post(
                    "chat/completions",
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": "ping"}],
                        "max_tokens": 10,
                    },
                    timeout=httpx.Timeout(15.0, connect=5.0),
                )
            resp.raise_for_status()
            health.healthy = True
            health.consecutive_failures = 0
            health.last_success_time = time.time()
            return True
        except Exception:
            self._mark_model_unhealthy(model_name)
            return False

    def _mark_model_unhealthy(self, model_name: str) -> None:
        health = self._health[model_name]
        health.healthy = False
        health.consecutive_failures += 1
        health.total_errors += 1
        health.last_error_time = time.time()
        stats = self._stats[model_name]
        health.error_rate = (
            round(stats.failures / stats.calls, 4) if stats.calls > 0 else 0.0
        )

    def _should_retry_model(self, model_name: str) -> bool:
        health = self._health.get(model_name)
        if health is None:
            return True
        if health.healthy:
            return True
        elapsed = time.time() - health.last_error_time
        if elapsed >= self._unhealthy_retry_seconds:
            health.healthy = True
            health.consecutive_failures = 0
            return True
        return False

    def get_model_health(self) -> dict:
        result = {}
        for model_name, health in self._health.items():
            result[model_name] = {
                "healthy": health.healthy,
                "consecutive_failures": health.consecutive_failures,
                "total_errors": health.total_errors,
                "error_rate": health.error_rate,
                "last_error_time": health.last_error_time,
                "last_success_time": health.last_success_time,
                "last_checked_time": health.last_checked_time,
                "model_info": {
                    "provider": self.MODELS[model_name]["provider"],
                    "cost_per_1k_tokens": self.MODELS[model_name]["cost_per_1k_tokens"],
                    "quality_score": self.MODELS[model_name]["quality_score"],
                } if model_name in self.MODELS else None,
            }
        return result

    async def _call_model(
        self,
        model_name: str,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict:
        model_info = self.MODELS[model_name]
        provider = model_info["provider"]
        api_key = self._get_provider_api_key(provider)

        if not api_key:
            raise RuntimeError(f"Provider {provider} API key not configured")

        client = await self._get_client(provider)

        if provider == "anthropic":
            payload = {
                "model": model_name,
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            }
            resp = await client.post("v1/messages", json=payload)
        else:
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            resp = await client.post("chat/completions", json=payload)

        resp.raise_for_status()
        data = resp.json()

        if provider == "anthropic":
            content = data.get("content", [{}])[0].get("text", "")
            usage = data.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
        else:
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)

        return {
            "content": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        }

    async def _call_model_messages(
        self,
        model_name: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict:
        model_info = self.MODELS[model_name]
        provider = model_info["provider"]
        api_key = self._get_provider_api_key(provider)

        if not api_key:
            raise RuntimeError(f"Provider {provider} API key not configured")

        client = await self._get_client(provider)

        if provider == "anthropic":
            system_messages = [m["content"] for m in messages if m["role"] == "system"]
            chat_messages = [m for m in messages if m["role"] != "system"]
            payload = {
                "model": model_name,
                "max_tokens": max_tokens,
                "messages": chat_messages,
            }
            if system_messages:
                payload["system"] = "\n\n".join(system_messages)
            resp = await client.post("v1/messages", json=payload)
        else:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            resp = await client.post("chat/completions", json=payload)

        resp.raise_for_status()
        data = resp.json()

        if provider == "anthropic":
            content = data.get("content", [{}])[0].get("text", "")
            usage = data.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
        else:
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)

        return {
            "content": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        }

    async def route_request(
        self,
        task_type: str,
        prompt: str,
        priority: str = "balanced",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tenant_id: int = 0,
        user_id: int = 0,
    ) -> dict:
        """路由请求到最优模型，失败时自动 fallback"""
        prompt_hash = self._hash_prompt(task_type, prompt)

        cached = await self.get_cached_response(task_type, prompt_hash)
        if cached:
            cached["cached"] = True
            return cached

        if tenant_id > 0:
            estimated_input = max(len(prompt) // 4, 1)
            estimated_total = estimated_input + max_tokens
            if not await token_monitor.check_quota(
                str(tenant_id), str(user_id), estimated_total
            ):
                return {
                    "model": None,
                    "provider": None,
                    "content": "Token 配额已超限，请升级方案或等待配额重置",
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": 0,
                    "cost": 0.0,
                    "priority": priority,
                    "fallback_used": False,
                    "error": "quota_exceeded",
                    "cached": False,
                }

        budget = self.check_budget(str(tenant_id)) if tenant_id > 0 else None
        use_cheap_model = budget and budget["is_tight"]

        candidates = self._get_ordered_candidates(task_type, priority)
        if use_cheap_model:
            cheap = self._get_cost_effective_model(task_type, candidates)
            candidates = [cheap] + [m for m in candidates if m != cheap]

        last_error: Optional[Exception] = None

        for model_name in candidates:
            if not self._should_retry_model(model_name):
                logger.debug("Skipping unhealthy model: %s", model_name)
                continue

            start_time = time.monotonic()
            try:
                result = await self._call_model(
                    model_name, prompt, temperature=temperature, max_tokens=max_tokens
                )
                elapsed_ms = int((time.monotonic() - start_time) * 1000)

                model_info = self.MODELS[model_name]
                input_tokens = result["input_tokens"] or len(prompt) // 4
                output_tokens = result["output_tokens"] or len(result["content"]) // 4
                cost = (input_tokens + output_tokens) / 1000 * model_info["cost_per_1k_tokens"]

                stats = self._stats[model_name]
                stats.calls += 1
                stats.successes += 1
                stats.total_latency_ms += elapsed_ms
                stats.total_cost += cost
                stats.total_input_tokens += input_tokens
                stats.total_output_tokens += output_tokens

                self._health[model_name].last_success_time = time.time()

                if tenant_id > 0:
                    await token_monitor.record_usage(
                        str(tenant_id), str(user_id),
                        input_tokens, output_tokens, model_name,
                    )
                    self.record_spend(str(tenant_id), cost)

                response = {
                    "model": model_name,
                    "provider": model_info["provider"],
                    "content": result["content"],
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": elapsed_ms,
                    "cost": round(cost, 6),
                    "priority": priority,
                    "fallback_used": model_name != candidates[0],
                    "cached": False,
                }

                cache_ttl = 86400
                await self.cache_response(task_type, prompt_hash, response, ttl=cache_ttl)

                return response
            except Exception as e:
                last_error = e
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                stats = self._stats[model_name]
                stats.calls += 1
                stats.failures += 1
                stats.total_latency_ms += elapsed_ms
                self._mark_model_unhealthy(model_name)
                logger.warning(
                    "Model %s call failed (task=%s): %s",
                    model_name,
                    task_type,
                    str(e),
                )

        return {
            "model": None,
            "provider": None,
            "content": f"所有模型调用失败: {last_error}",
            "input_tokens": 0,
            "output_tokens": 0,
            "latency_ms": 0,
            "cost": 0.0,
            "priority": priority,
            "fallback_used": False,
            "error": str(last_error) if last_error else "No models available",
            "cached": False,
        }

    async def route_request_messages(
        self,
        task_type: str,
        messages: list[dict],
        priority: str = "balanced",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tenant_id: int = 0,
        user_id: int = 0,
    ) -> dict:
        prompt_str = " ".join(
            m.get("content", "") for m in messages
            if isinstance(m, dict) and m.get("content")
        )
        prompt_hash = self._hash_prompt(task_type, prompt_str)

        cached = await self.get_cached_response(task_type, prompt_hash)
        if cached:
            cached["cached"] = True
            return cached

        if tenant_id > 0:
            total_char_len = sum(len(m.get("content", "")) for m in messages)
            estimated_input = max(total_char_len // 4, 1)
            estimated_total = estimated_input + max_tokens
            if not await token_monitor.check_quota(
                str(tenant_id), str(user_id), estimated_total
            ):
                return {
                    "model": None,
                    "provider": None,
                    "content": "Token 配额已超限，请升级方案或等待配额重置",
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": 0,
                    "cost": 0.0,
                    "priority": priority,
                    "fallback_used": False,
                    "error": "quota_exceeded",
                    "cached": False,
                }

        budget = self.check_budget(str(tenant_id)) if tenant_id > 0 else None
        use_cheap_model = budget and budget["is_tight"]

        candidates = self._get_ordered_candidates(task_type, priority)
        if use_cheap_model:
            cheap = self._get_cost_effective_model(task_type, candidates)
            candidates = [cheap] + [m for m in candidates if m != cheap]

        last_error: Optional[Exception] = None

        for model_name in candidates:
            if not self._should_retry_model(model_name):
                logger.debug("Skipping unhealthy model: %s", model_name)
                continue

            start_time = time.monotonic()
            try:
                result = await self._call_model_messages(
                    model_name, messages, temperature=temperature, max_tokens=max_tokens
                )
                elapsed_ms = int((time.monotonic() - start_time) * 1000)

                model_info = self.MODELS[model_name]
                total_char_len = sum(len(m.get("content", "")) for m in messages)
                input_tokens = result["input_tokens"] or total_char_len // 4
                output_tokens = result["output_tokens"] or len(result["content"]) // 4
                cost = (input_tokens + output_tokens) / 1000 * model_info["cost_per_1k_tokens"]

                stats = self._stats[model_name]
                stats.calls += 1
                stats.successes += 1
                stats.total_latency_ms += elapsed_ms
                stats.total_cost += cost
                stats.total_input_tokens += input_tokens
                stats.total_output_tokens += output_tokens

                self._health[model_name].last_success_time = time.time()

                if tenant_id > 0:
                    await token_monitor.record_usage(
                        str(tenant_id), str(user_id),
                        input_tokens, output_tokens, model_name,
                    )
                    self.record_spend(str(tenant_id), cost)

                response = {
                    "model": model_name,
                    "provider": model_info["provider"],
                    "content": result["content"],
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": elapsed_ms,
                    "cost": round(cost, 6),
                    "priority": priority,
                    "fallback_used": model_name != candidates[0],
                    "cached": False,
                }

                cache_ttl = 86400
                await self.cache_response(task_type, prompt_hash, response, ttl=cache_ttl)

                return response
            except Exception as e:
                last_error = e
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                stats = self._stats[model_name]
                stats.calls += 1
                stats.failures += 1
                stats.total_latency_ms += elapsed_ms
                self._mark_model_unhealthy(model_name)
                logger.warning(
                    "Model %s messages call failed (task=%s): %s",
                    model_name,
                    task_type,
                    str(e),
                )

        return {
            "model": None,
            "provider": None,
            "content": f"所有模型调用失败: {last_error}",
            "input_tokens": 0,
            "output_tokens": 0,
            "latency_ms": 0,
            "cost": 0.0,
            "priority": priority,
            "fallback_used": False,
            "error": str(last_error) if last_error else "No models available",
            "cached": False,
        }

    async def chat_json_messages(
        self,
        task_type: str,
        messages: list[dict],
        priority: str = "balanced",
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict:
        import json

        result = await self.route_request_messages(
            task_type, messages, priority=priority, temperature=temperature, max_tokens=max_tokens
        )
        try:
            result["json"] = json.loads(result["content"])
        except (json.JSONDecodeError, ValueError):
            result["json"] = None
        return result

    @property
    def is_available(self) -> bool:
        for model_info in self.MODELS.values():
            provider = model_info["provider"]
            if self._get_provider_api_key(provider):
                return True
        return False

    def get_default_model(self) -> str:
        available = [
            name for name, info in self.MODELS.items()
            if self._get_provider_api_key(info["provider"])
        ]
        if not available:
            available = list(self.MODELS.keys())
        candidates = self.TASK_MODEL_PREFERENCE.get("threat_analysis", available)
        candidates = [m for m in candidates if m in self.MODELS and m in available]
        if not candidates:
            candidates = available
        return self.select_model("threat_analysis", "balanced")

    def get_model_stats(self) -> dict:
        """获取模型使用统计"""
        models_stats = {}
        for model_name, stats in self._stats.items():
            models_stats[model_name] = {
                "calls": stats.calls,
                "successes": stats.successes,
                "failures": stats.failures,
                "success_rate": round(stats.successes / stats.calls, 4) if stats.calls > 0 else 0.0,
                "avg_latency_ms": round(stats.total_latency_ms / stats.calls, 1) if stats.calls > 0 else 0.0,
                "total_cost": round(stats.total_cost, 6),
                "total_input_tokens": stats.total_input_tokens,
                "total_output_tokens": stats.total_output_tokens,
            }

        total_calls = sum(s.calls for s in self._stats.values())
        total_successes = sum(s.successes for s in self._stats.values())
        total_cost = sum(s.total_cost for s in self._stats.values())
        total_latency = sum(s.total_latency_ms for s in self._stats.values())

        return {
            "models": models_stats,
            "summary": {
                "total_calls": total_calls,
                "total_successes": total_successes,
                "total_failures": total_calls - total_successes,
                "overall_success_rate": round(total_successes / total_calls, 4) if total_calls > 0 else 0.0,
                "total_cost": round(total_cost, 6),
                "avg_latency_ms": round(total_latency / total_calls, 1) if total_calls > 0 else 0.0,
            },
        }

    def get_available_models(self) -> list[dict]:
        """获取可用模型列表"""
        result = []
        for name, info in self.MODELS.items():
            provider = info["provider"]
            api_key = self._get_provider_api_key(provider)
            result.append({
                "name": name,
                "provider": provider,
                "capabilities": info["capabilities"],
                "cost_per_1k_tokens": info["cost_per_1k_tokens"],
                "max_tokens": info["max_tokens"],
                "latency_ms": info["latency_ms"],
                "quality_score": info["quality_score"],
                "available": bool(api_key),
            })
        return result

    def update_model(self, name: str, config: dict) -> bool:
        """动态更新模型配置"""
        if name not in self.MODELS:
            return False
        self.MODELS[name].update(config)
        return True

    def add_model(self, name: str, config: dict) -> bool:
        """动态添加模型"""
        if name in self.MODELS:
            return False
        self.MODELS[name] = config
        return True

    def remove_model(self, name: str) -> bool:
        """动态移除模型"""
        if name not in self.MODELS:
            return False
        del self.MODELS[name]
        for task_models in self.TASK_MODEL_PREFERENCE.values():
            if name in task_models:
                task_models.remove(name)
        return True

    def update_task_preference(self, task_type: str, models: list[str]) -> None:
        """动态更新任务模型偏好"""
        self.TASK_MODEL_PREFERENCE[task_type] = models

    async def close(self):
        for client in self._clients.values():
            if not client.is_closed:
                await client.aclose()
        self._clients.clear()


model_router = ModelRouter()
