"""
historial_documento.py
Responsabilidad: Modelo ORM para el historial de cambios y acciones de workflow de documentos.
Cada acción (crear, editar, enviar a revisión, aprobar, rechazar) se registra aquí.
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy import func
from app.models.base import Base


class HistorialDocumento(Base):
    __tablename__ = "historial_documento"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    documento_id = Column(String(36), ForeignKey("documentos.id"), nullable=False, index=True)
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    accion = Column(String(30), nullable=False)
    estado_anterior = Column(String(30), nullable=True)
    estado_nuevo = Column(String(30), nullable=True)
    comentario = Column(Text, nullable=True)
    version_numero = Column(String(10), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    documento = relationship("Documento", back_populates="historial")
