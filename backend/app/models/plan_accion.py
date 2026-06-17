"""
plan_accion.py
Responsabilidad: Modelo ORM para planes de acción vinculados a No Conformidades.
Dependencias: sqlalchemy, base.py
Exportaciones: PlanAccion
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class PlanAccion(Base, TimestampMixin):
    __tablename__ = "planes_accion"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nc_id = Column(String(36), ForeignKey("no_conformidades.id"), nullable=False)
    actividad = Column(Text, nullable=False)
    responsable_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String(20), default="pendiente")
    observaciones = Column(Text, nullable=True)

    nc = relationship("NoConformidad", back_populates="planes_accion")
