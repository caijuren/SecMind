import json
import logging
from typing import Optional

from app.ai.providers import llm_provider

logger = logging.getLogger(__name__)


class LLMClient:
    @property
    def is_available(self) -> bool:
        return llm_provider.is_available

    @property
    def model_name(self) -> str:
        return llm_provider.model_name

    async def chat(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        if not self.is_available:
            logger.warning("LLM 未配置，无法调用")
            raise RuntimeError("LLM 未配置，请设置 LLM_API_KEY 环境变量")

        last_error = None
        for attempt in range(3):
            try:
                return await llm_provider.chat(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            except Exception as e:
                last_error = e
                logger.warning("LLM 调用失败 (第 %d 次重试): %s", attempt + 1, str(e))
                continue

        raise RuntimeError(f"LLM 调用失败（已重试 3 次）: {last_error}")

    async def chat_json(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
    ) -> dict:
        text = await self.chat(
            messages + [{"role": "user", "content": "请以 JSON 格式返回结果，不要包含 markdown 代码块标记。"}],
            temperature=temperature,
        )
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            text = text.rsplit("```", 1)[0]
        return json.loads(text.strip())

    def chat_sync(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        import asyncio
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(
                self.chat(messages=messages, temperature=temperature, max_tokens=max_tokens)
            )
        finally:
            loop.close()

    def chat_json_sync(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
    ) -> dict:
        import asyncio
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(self.chat_json(messages=messages, temperature=temperature))
        finally:
            loop.close()

    async def close(self):
        pass


llm_client = LLMClient()