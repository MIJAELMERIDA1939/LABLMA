"""
no_conformidad.py
Responsabilidad: Modelo ORM para No Conformidades, TNC y Oportunidades de Mejora.
Dependencias: sqlalchemy, base.py
Exportaciones: NoConformidad
"""

from uuid import uuid4
from sqlalchemy import Column, String, Text, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

# String constants for state machine (used across routers/services)
class EstadoNC:
    abierta = "abierta"
    en_analisis = "en_analisis"
    plan_aprobado = "plan_aprobado"
    en_ejecucion = "en_ejecucion"
    cerrada = "cerrada"
    vencida = "vencida"


class NoConformidad(Base, TimestampMixin):
    __tablename__ = "no_conformidades"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    tipo = Column(String(20), nullable=False)
    fuente = Column(String(100), nullable=True)
    fecha_deteccion = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=False)
    evidencia_url = Column(String(500), nullable=True)
    area_afectada = Column(String(100), nullable=True)
    clasificacion = Column(String(20), nullable=False)
    responsable_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    aprobador_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    verificador_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    estado = Column(String(20), default="abierta")
    fecha_limite = Column(Date, nullable=False)
    fecha_cierre = Column(Date, nullable=True)
    eficaz = Column(Boolean, nullable=True)
    analisis_causa = Column(Text, nullable=True)
    correccion = Column(Text, nullable=True)

    planes_accion = relationship("PlanAccion", back_populates="nc", cascade="all, delete-orphan")
