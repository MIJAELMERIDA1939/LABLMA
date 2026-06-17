"""
schemas/riesgo.py
Responsabilidad: Pydantic schemas para la matriz de riesgos.
Dependencias: pydantic
Exportaciones: RiesgoCreate, RiesgoUpdate, RiesgoOut
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class RiesgoCreate(BaseModel):
    codigo: str
    proceso: Optional[str] = None
    descripcion: str
    probabilidad: int
    impacto: int
    tipo_tratamiento: Optional[str] = None
    accion: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_revision: Optional[date] = None

    @field_validator("probabilidad", "impacto")
    @classmethod
    def check_range(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Debe estar entre 1 y 5")
        return v


class RiesgoUpdate(BaseModel):
    proceso: Optional[str] = None
    descripcion: Optional[str] = None
    probabilidad: Optional[int] = None
    impacto: Optional[int] = None
    tipo_tratamiento: Optional[str] = None
    accion: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_revision: Optional[date] = None
    estado: Optional[str] = None


class RiesgoOut(BaseModel):
    id: UUID
    codigo: str
    proceso: Optional[str] = None
    descripcion: str
    probabilidad: int
    impacto: int
    nivel_riesgo: Optional[int] = None
    tipo_tratamiento: Optional[str] = None
    accion: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_revision: Optional[date] = None
    estado: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
