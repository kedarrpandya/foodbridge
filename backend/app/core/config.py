from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_name: str = "FoodBridge - Connecting Surplus to Need"
    secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24

    # Database URL with Railway fallback
    database_url: str = "sqlite:///./database.db"

    cors_origins: list[str] = ["*"]

    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"  # Cost-effective model
    openai_enabled: bool = False  # Enable/disable AI features

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Handle Railway's malformed DATABASE_URL
        raw_db_url = os.getenv('DATABASE_URL') or os.getenv('database_url')
        if raw_db_url:
            # Check if it's a valid PostgreSQL URL
            if raw_db_url.startswith('postgresql://') or raw_db_url.startswith('postgres://'):
                self.database_url = raw_db_url
            elif raw_db_url.startswith('sqlite://'):
                self.database_url = raw_db_url
            else:
                # Railway might provide malformed URLs, fall back to SQLite
                print(f"Warning: Invalid DATABASE_URL format: {raw_db_url}")
                print("Falling back to SQLite database")
                self.database_url = "sqlite:///./database.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()


