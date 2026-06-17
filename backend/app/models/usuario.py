"""
usuario.py
Responsabilidad: Modelo ORM para usuarios del sistema.
Dependencias: sqlalchemy, base.py
Exportaciones: Usuario
"""

import uuid
from sqlalchemy import Column, String, Boolean
from app.models.base import Base, TimestampMixin
from uuid import uuid4


class Usuario(Base, TimestampMixin):
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    telefono = Column(String(20), nullable=True)
    activo = Column(Boolean, default=True)
