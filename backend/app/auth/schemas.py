"""
auth/schemas.py
Responsabilidad: Pydantic schemas para autenticación.
Dependencias: pydantic
Exportaciones: LoginRequest, TokenResponse, UserOut
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: UUID
    nombre: str
    email: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str
