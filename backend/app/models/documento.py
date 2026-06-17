"""
documento.py
Responsabilidad: Modelo ORM para documentos del sistema documental.
Dependencias: sqlalchemy, base.py, usuario.py
Exportaciones: Documento
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import func
from app.models.base import Base, TimestampMixin


class Documento(Base, TimestampMixin):
    __tablename__ = "documentos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    titulo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=False)
    iso_norma = Column(Text, nullable=False, default="[]")
    estado = Column(String(30), default="borrador")
    version_actual = Column(Integer, default=1)

    # Workflow: 3 niveles jerárquicos
    elaborador_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    revisor_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    aprobador_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)

    # Fechas de flujo
    fecha_elaboracion = Column(Date, nullable=True)
    fecha_revision = Column(DateTime, nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    fecha_vigencia = Column(Date, nullable=True)
    fecha_obsoleto = Column(Date, nullable=True)
    motivo_rechazo = Column(Text, nullable=True)
    acceso_roles = Column(Text, nullable=True)

    versiones = relationship("VersionDocumento", back_populates="documento", cascade="all, delete-orphan")
    historial = relationship("HistorialDocumento", back_populates="documento", cascade="all, delete-orphan")
