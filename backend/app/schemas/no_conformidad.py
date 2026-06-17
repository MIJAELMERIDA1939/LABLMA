"""
schemas/no_conformidad.py
Responsabilidad: Pydantic schemas para No Conformidades y planes de acción.
Dependencias: pydantic
Exportaciones: NCCreate, NCUpdate, NCOut, PlanAccionCreate, PlanAccionOut
"""

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class PlanAccionCreate(BaseModel):
    actividad: str
    responsable_id: Optional[UUID] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class PlanAccionUpdate(BaseModel):
    actividad: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None


class PlanAccionOut(BaseModel):
    id: UUID
    nc_id: UUID
    actividad: str
    responsable_id: Optional[UUID] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: str
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


class NCCreate(BaseModel):
    codigo: str
    tipo: str
    fuente: Optional[str] = None
    fecha_deteccion: date
    descripcion: str
    evidencia_url: Optional[str] = None
    area_afectada: Optional[str] = None
    clasificacion: str
    responsable_id: Optional[UUID] = None
    aprobador_id: Optional[UUID] = None
    verificador_id: Optional[UUID] = None
    fecha_limite: date


class NCUpdate(BaseModel):
    tipo: Optional[str] = None
    fuente: Optional[str] = None
    descripcion: Optional[str] = None
    clasificacion: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_limite: Optional[date] = None


class NCOut(BaseModel):
    id: UUID
    codigo: str
    tipo: str
    fuente: Optional[str] = None
    fecha_deteccion: date
    descripcion: str
    evidencia_url: Optional[str] = None
    area_afectada: Optional[str] = None
    clasificacion: str
    responsable_id: Optional[UUID] = None
    aprobador_id: Optional[UUID] = None
    verificador_id: Optional[UUID] = None
    estado: str
    fecha_limite: date
    fecha_cierre: Optional[date] = None
    eficaz: Optional[bool] = None
    analisis_causa: Optional[str] = None
    correccion: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    planes_accion: list[PlanAccionOut] = []

    class Config:
        from_attributes = True


class AnalisisInput(BaseModel):
    analisis_causa: str
    correccion: str


class CierreInput(BaseModel):
    observaciones: str = ""


class ValidarCierreInput(BaseModel):
    eficaz: bool
    observaciones: str = ""
