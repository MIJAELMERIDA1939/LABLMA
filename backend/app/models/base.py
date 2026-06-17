"""
base.py
Responsabilidad: Base declarativa y mixin para timestamps en todos los modelos.
Dependencias: sqlalchemy, database.py
Exportaciones: Base, TimestampMixin
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, func
from app.database import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
