import os
from typing import List

from dotenv import load_dotenv


load_dotenv(override=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def parse_origins(value: str) -> List[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


class Config:
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "5000"))
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    CORS_ORIGINS = parse_origins(
        os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    )

    GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
    MONGO_DATABASE = os.getenv("MONGO_DATABASE", "portfolio_new")

    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ikh.dev")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123")
    ADMIN_NAME = os.getenv("ADMIN_NAME", "Admin")
    ADMIN_SESSION_MAX_AGE_MINUTES = int(os.getenv("ADMIN_SESSION_MAX_AGE_MINUTES", "480"))
    ADMIN_IDLE_TIMEOUT_MINUTES = int(os.getenv("ADMIN_IDLE_TIMEOUT_MINUTES", "30"))

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    API_LOG_BODY = os.getenv("API_LOG_BODY", "true").lower() == "true"
    API_LOG_FILE = os.getenv("API_LOG_FILE", os.path.join(BASE_DIR, "logs", "api.log"))
