from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "FoodBridge - Connecting Surplus to Need"
    secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24

    # Use SQLite by default for local dev to avoid external dependencies
    database_url: str = "sqlite:///./database.db"

    cors_origins: list[str] = ["*"]
    
    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"  # Cost-effective model
    openai_enabled: bool = False  # Enable/disable AI features

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


