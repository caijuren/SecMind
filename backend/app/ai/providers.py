import json
import logging
from abc import ABC, abstractmethod
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        ...

    @abstractmethod
    async def chat_json(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
    ) -> dict:
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        ...

    @property
    @abstractmethod
    def is_available(self) -> bool:
        ...


class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str = "https://api.openai.com/v1",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: float = 30.0,
    ):
        self._api_key = api_key
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._max_tokens = max_tokens
        self._temperature = temperature
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def chat(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        client = await self._get_client()
        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self._temperature,
            "max_tokens": max_tokens if max_tokens is not None else self._max_tokens,
        }
        resp = await client.post(
            f"{self._base_url}/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {self._api_key}"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

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

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None


def create_provider() -> BaseLLMProvider:
    provider_type = (settings.LLM_PROVIDER or "openai").lower()
    api_key = settings.LLM_API_KEY or ""
    base_url = settings.LLM_BASE_URL or ""
    model = settings.LLM_MODEL or "gpt-4o"

    if not api_key:
        logger.warning("LLM_API_KEY 未配置，AI 分析功能受限。请设置 LLM_API_KEY 环境变量。")
        return _UnavailableProvider()

    if provider_type == "openai":
        return OpenAICompatibleProvider(
            api_key=api_key,
            model=model,
            base_url=base_url or "https://api.openai.com/v1",
        )
    elif provider_type == "azure":
        return OpenAICompatibleProvider(
            api_key=api_key,
            model=model,
            base_url=base_url,
        )
    elif provider_type == "deepseek":
        return OpenAICompatibleProvider(
            api_key=api_key,
            model=model or "deepseek-chat",
            base_url=base_url or "https://api.deepseek.com/v1",
        )
    elif provider_type == "qwen":
        return OpenAICompatibleProvider(
            api_key=api_key,
            model=model or "qwen-max",
            base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
    elif provider_type == "ollama":
        return OpenAICompatibleProvider(
            api_key="ollama",
            model=model or "qwen2.5:7b",
            base_url=base_url or "http://localhost:11434/v1",
        )
    else:
        logger.warning("未知 LLM provider: %s，使用 OpenAI 兼容模式", provider_type)
        return OpenAICompatibleProvider(
            api_key=api_key,
            model=model,
            base_url=base_url or "https://api.openai.com/v1",
        )


class _UnavailableProvider(BaseLLMProvider):
    @property
    def model_name(self) -> str:
        return "unavailable"

    @property
    def is_available(self) -> bool:
        return False

    async def chat(self, messages, temperature=None, max_tokens=None) -> str:
        raise RuntimeError("LLM 未配置，请设置 LLM_API_KEY 环境变量")

    async def chat_json(self, messages, temperature=None) -> dict:
        raise RuntimeError("LLM 未配置，请设置 LLM_API_KEY 环境变量")


llm_provider = create_provider()