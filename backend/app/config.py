"""
config.py
Responsabilidad: Configuración centralizada vía variables de entorno usando pydantic-settings.
Dependencias: pydantic-settings, python-dotenv
Exportaciones: Settings (singleton), get_settings()
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SGC - Sistema de Gestión de Calidad"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///../data/sgc.db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-min-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # SMTP Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # WhatsApp Business Cloud API
    WHATSAPP_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_TEMPLATE_NC: str = "alerta_nc"
    WHATSAPP_TEMPLATE_DOC: str = "alerta_documento"

    # Scheduler
    CRON_SECRET: str = "change-cron-secret"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
