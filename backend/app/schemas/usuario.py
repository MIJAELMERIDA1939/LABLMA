"""
schemas/usuario.py
Responsabilidad: Pydantic schemas para CRUD de usuarios.
Dependencias: pydantic
Exportaciones: UsuarioCreate, UsuarioUpdate, UsuarioOut
"""

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str
    telefono: Optional[str] = None


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioOut(BaseModel):
    id: UUID
    nombre: str
    email: str
    rol: str
    telefono: Optional[str] = None
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
