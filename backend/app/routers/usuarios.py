"""
routers/usuarios.py
Responsabilidad: CRUD de usuarios del sistema.
Dependencias: fastapi, sqlalchemy, auth, models
Endpoints: GET/POST/PUT/DELETE /usuarios
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.auth.service import hash_password
from app.auth.dependencies import get_current_user, require_role


class UsuarioPaginatedResponse(BaseModel):
    items: list[UsuarioOut]
    total: int
    limit: int
    offset: int

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=UsuarioPaginatedResponse)
async def list_usuarios(
    search: str = None,
    rol: str = None,
    limit: int = 15,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin")),
):
    query = select(Usuario)
    count_query = select(func.count(Usuario.id))

    if search:
        pattern = f"%{search}%"
        query = query.where(Usuario.nombre.ilike(pattern) | Usuario.email.ilike(pattern))
        count_query = count_query.where(Usuario.nombre.ilike(pattern) | Usuario.email.ilike(pattern))
    if rol:
        query = query.where(Usuario.rol == rol)
        count_query = count_query.where(Usuario.rol == rol)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Usuario.nombre).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return UsuarioPaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    body: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin")),
):
    existing = await db.execute(select(Usuario).where(Usuario.email == body.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user = Usuario(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        rol=body.rol,
        telefono=body.telefono,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UsuarioOut)
async def get_usuario(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin")),
):
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/{user_id}", response_model=UsuarioOut)
async def update_usuario(
    user_id: str,
    body: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin")),
):
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_usuario(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin")),
):
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = False
    await db.commit()
    return {"detail": "Usuario desactivado"}
