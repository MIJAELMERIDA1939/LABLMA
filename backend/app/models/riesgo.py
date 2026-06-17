"""
riesgo.py
Responsabilidad: Modelo ORM para la matriz de riesgos con probabilidad/impacto.
Dependencias: sqlalchemy, base.py
Exportaciones: Riesgo
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Integer, Date, ForeignKey
from app.models.base import Base, TimestampMixin


class Riesgo(Base, TimestampMixin):
    __tablename__ = "riesgos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    proceso = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=False)
    probabilidad = Column(Integer, nullable=False)
    impacto = Column(Integer, nullable=False)
    tipo_tratamiento = Column(String(20), nullable=True)
    accion = Column(Text, nullable=True)
    responsable_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    fecha_revision = Column(Date, nullable=True)
    estado = Column(String(20), default="activo")
