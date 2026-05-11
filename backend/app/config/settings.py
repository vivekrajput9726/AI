from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AI Healthcare Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "aihealthcare"

    JWT_SECRET_KEY: str = "changeme-super-secret-key-minimum-32-characters"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    DAILY_API_KEY: str = ""
    DAILY_API_URL: str = "https://api.daily.co/v1"

    class Config:
        env_file = ".env"


settings = Settings()
