"""
schemas/documento.py
Responsabilidad: Pydantic schemas para documentos y versiones.
Dependencias: pydantic
Exportaciones: DocumentoCreate, DocumentoUpdate, DocumentoOut, VersionOut
"""

import json
from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class DocumentoCreate(BaseModel):
    codigo: str
    titulo: str
    tipo: str
    iso_norma: list[str] = []
    contenido_html: str = ""
    elaborado_por: Optional[UUID] = None
    acceso_roles: Optional[list[str]] = None


class DocumentoUpdate(BaseModel):
    titulo: Optional[str] = None
    contenido_html: Optional[str] = None
    iso_norma: Optional[list[str]] = None
    acceso_roles: Optional[list[str]] = None


class VersionOut(BaseModel):
    id: UUID
    numero_version: int
    contenido_html: str
    contenido_pdf_url: Optional[str] = None
    motivo_cambio: Optional[str] = None
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentoOut(BaseModel):
    id: UUID
    codigo: str
    titulo: str
    tipo: str
    iso_norma: list[str]
    estado: str
    version_actual: int
    elaborado_por: Optional[UUID] = None
    verificado_por: Optional[UUID] = None
    aprobado_por: Optional[UUID] = None
    fecha_elaboracion: Optional[date] = None
    fecha_vigencia: Optional[date] = None
    fecha_obsoleto: Optional[date] = None
    acceso_roles: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("iso_norma", mode="before")
    @classmethod
    def parse_iso_norma(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else []
        return v or []

    @field_validator("acceso_roles", mode="before")
    @classmethod
    def parse_acceso_roles(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else []
        return v or []

    class Config:
        from_attributes = True


class DocumentoDetailOut(DocumentoOut):
    versiones: list[VersionOut] = []


class PaginatedResponse(BaseModel):
    items: list[DocumentoOut]
    total: int
    limit: int
    offset: int
