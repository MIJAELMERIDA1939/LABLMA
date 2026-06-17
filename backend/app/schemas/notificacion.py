"""
schemas/notificacion.py
Responsabilidad: Pydantic schemas para notificaciones.
Dependencias: pydantic
Exportaciones: NotificacionOut
"""

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class NotificacionOut(BaseModel):
    id: UUID
    usuario_id: UUID
    tipo: str
    titulo: str
    mensaje: Optional[str] = None
    leida: bool
    referencia_tipo: Optional[str] = None
    referencia_id: Optional[UUID] = None
    canal_enviado: Optional[list[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True
