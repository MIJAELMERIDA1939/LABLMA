"""
plan_programa.py
Responsabilidad: Modelo ORM para Planes y Programas (tipo Gantt).
Dependencias: sqlalchemy, base.py
Exportaciones: PlanPrograma
"""

from uuid import uuid4
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class PlanPrograma(Base, TimestampMixin):
    __tablename__ = "planes_programas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    titulo = Column(String(255), nullable=False)
    iso_norma = Column(String(20), nullable=False)
    ano = Column(Integer, nullable=False)
    estado = Column(String(20), default="borrador")
    elaborado_por = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    aprobado_por = Column(String(36), ForeignKey("usuarios.id"), nullable=True)

    tareas = relationship("TareaPlan", back_populates="plan", cascade="all, delete-orphan")
