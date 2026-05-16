import os
import secrets

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./secmind.db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "secmind")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "secmind")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "4096"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_BASE_URL: str = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    ALIYUN_API_KEY: str = os.getenv("ALIYUN_API_KEY", "")
    ALIYUN_BASE_URL: str = os.getenv("ALIYUN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")

    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    THREATFOX_API_URL: str = os.getenv("THREATFOX_API_URL", "https://threatfox-api.abuse.ch/api/v1/")
    IOC_CACHE_TTL: int = int(os.getenv("IOC_CACHE_TTL", "3600"))
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "./reports")

    FIREWALL_API_URL: str = os.getenv("FIREWALL_API_URL", "")
    FIREWALL_API_KEY: str = os.getenv("FIREWALL_API_KEY", "")
    EDR_API_URL: str = os.getenv("EDR_API_URL", "")
    EDR_API_KEY: str = os.getenv("EDR_API_KEY", "")
    SIEM_API_URL: str = os.getenv("SIEM_API_URL", "")
    SIEM_API_KEY: str = os.getenv("SIEM_API_KEY", "")
    AD_API_URL: str = os.getenv("AD_API_URL", "")
    AD_API_KEY: str = os.getenv("AD_API_KEY", "")
    AD_DOMAIN: str = os.getenv("AD_DOMAIN", "")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SECRET_KEY:
            self.SECRET_KEY = secrets.token_urlsafe(32)
        if not self.POSTGRES_PASSWORD and self.DATABASE_URL.startswith("postgresql"):
            raise ValueError(
                "POSTGRES_PASSWORD must be set when using PostgreSQL. "
                "Set it via environment variable or .env file."
            )

    @property
    def postgres_url(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
