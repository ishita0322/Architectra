from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application
    app_name: str = "AI System Architect"
    environment: str = "development"

    # Database — SQLite for zero-setup local dev; Postgres under docker compose.
    database_url: str = "sqlite:///./architect.db"

    # Auth (used from Milestone 1 onward)
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # AI provider (used from Milestone 5 onward).
    # Local venv dev talks to Ollama on localhost; under docker compose the
    # backend overrides this with host.docker.internal via .env.
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"
    # Generation can be slow on CPU inference; give the model room. The
    # database-schema prompt (full DDL) is the heaviest, so default generously.
    ollama_timeout_seconds: float = 300.0

    # CORS
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
