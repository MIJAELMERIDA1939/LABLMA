"""
schemas/plan_programa.py
Responsabilidad: Pydantic schemas para Planes/Programas y tareas.
Dependencias: pydantic
Exportaciones: PlanCreate, PlanUpdate, PlanOut, TareaCreate, TareaUpdate, TareaOut
"""

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class TareaCreate(BaseModel):
    nombre: str
    responsable_id: Optional[UUID] = None
    fecha_inicio: date
    fecha_fin: date


class TareaUpdate(BaseModel):
    nombre: Optional[str] = None
    responsable_id: Optional[UUID] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    progreso: Optional[int] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None


class TareaOut(BaseModel):
    id: UUID
    plan_id: UUID
    nombre: str
    responsable_id: Optional[UUID] = None
    fecha_inicio: date
    fecha_fin: date
    progreso: int
    estado: str
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


class PlanCreate(BaseModel):
    titulo: str
    iso_norma: str = ""
    ano: int
    elaborado_por: Optional[UUID] = None


class PlanUpdate(BaseModel):
    titulo: Optional[str] = None
    iso_norma: Optional[str] = None
    ano: Optional[int] = None
    estado: Optional[str] = None


class PlanOut(BaseModel):
    id: UUID
    titulo: str
    iso_norma: str
    ano: int
    estado: str
    elaborado_por: Optional[UUID] = None
    aprobado_por: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    tareas: list[TareaOut] = []

    class Config:
        from_attributes = True
