"""
notificacion.py
Responsabilidad: Modelo ORM para notificaciones in-app del sistema.
Dependencias: sqlalchemy, base.py
Exportaciones: Notificacion
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from app.models.base import Base, TimestampMixin


class TipoNotificacion:
    alerta_vencimiento = "alerta_vencimiento"
    pendiente_aprobacion = "pendiente_aprobacion"
    nc_asignada = "nc_asignada"
    tarea_asignada = "tarea_asignada"


class Notificacion(Base, TimestampMixin):
    __tablename__ = "notificaciones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(30), nullable=False)
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=True)
    leida = Column(Boolean, default=False)
    referencia_tipo = Column(String(50), nullable=True)
    referencia_id = Column(String(36), nullable=True)
    canal_enviado = Column(Text, nullable=True)
