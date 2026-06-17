"""
version_documento.py
Responsabilidad: Modelo ORM para versiones de documentos, con contenido HTML y PDF generado.
Dependencias: sqlalchemy, base.py, documento.py
Exportaciones: VersionDocumento
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class VersionDocumento(Base, TimestampMixin):
    __tablename__ = "versiones_documento"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    documento_id = Column(String(36), ForeignKey("documentos.id"), nullable=False)
    numero_version = Column(Integer, nullable=False)
    contenido_html = Column(Text, nullable=False, default="")
    contenido_pdf_url = Column(String(500), nullable=True)
    motivo_cambio = Column(Text, nullable=True)
    autor_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    estado = Column(String(20), default="borrador")

    documento = relationship("Documento", back_populates="versiones")
