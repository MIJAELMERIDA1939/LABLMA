"""
schemas/workflow.py
Responsabilidad: Pydantic schemas para el workflow de documentos.
Dependencias: pydantic
"""

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class EnviarRevision(BaseModel):
    comentario: Optional[str] = None


class AprobarDocumento(BaseModel):
    comentario: Optional[str] = None


class RechazarDocumento(BaseModel):
    motivo: str
    comentario: Optional[str] = None


class AutoSaveRequest(BaseModel):
    contenido_html: str
    titulo: Optional[str] = None


class HistorialOut(BaseModel):
    id: UUID
    usuario_id: UUID
    usuario_nombre: Optional[str] = None
    accion: str
    estado_anterior: Optional[str] = None
    estado_nuevo: Optional[str] = None
    comentario: Optional[str] = None
    version_numero: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowState(BaseModel):
    documento_id: UUID
    estado: str
    elaborador_id: Optional[UUID] = None
    elaborador_nombre: Optional[str] = None
    revisor_id: Optional[UUID] = None
    revisor_nombre: Optional[str] = None
    aprobador_id: Optional[UUID] = None
    aprobador_nombre: Optional[str] = None
    fecha_elaboracion: Optional[str] = None
    fecha_revision: Optional[str] = None
    fecha_aprobacion: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    acciones_disponibles: list[str] = []
