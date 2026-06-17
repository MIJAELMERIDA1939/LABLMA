"""
tarea_plan.py
Responsabilidad: Modelo ORM para tareas dentro de un Plan/Programa.
Dependencias: sqlalchemy, base.py
Exportaciones: TareaPlan
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class EstadoTarea:
    pendiente = "pendiente"
    en_curso = "en_curso"
    completada = "completada"
    vencida = "vencida"


class TareaPlan(Base, TimestampMixin):
    __tablename__ = "tareas_plan"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    plan_id = Column(String(36), ForeignKey("planes_programas.id"), nullable=False)
    nombre = Column(String(255), nullable=False)
    responsable_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    progreso = Column(Integer, default=0)
    estado = Column(String(20), default="pendiente")
    observaciones = Column(Text, nullable=True)

    plan = relationship("PlanPrograma", back_populates="tareas")
