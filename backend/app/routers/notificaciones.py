"""
routers/notificaciones.py
Responsabilidad: Endpoints para notificaciones in-app del usuario actual.
Dependencias: fastapi, sqlalchemy, models
Endpoints: GET /notificaciones, POST /{id}/leer, POST /leer-todas
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.usuario import Usuario
from app.models.notificacion import Notificacion
from app.schemas.notificacion import NotificacionOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("/", response_model=list[NotificacionOut])
async def list_notificaciones(
    leida: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = select(Notificacion).where(
        Notificacion.usuario_id == current_user.id,
        Notificacion.leida == leida,
    ).order_by(Notificacion.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{notif_id}/leer", response_model=NotificacionOut)
async def marcar_leida(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(Notificacion).where(
            Notificacion.id == notif_id,
            Notificacion.usuario_id == current_user.id,
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notif.leida = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.post("/leer-todas")
async def marcar_todas_leidas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    await db.execute(
        update(Notificacion)
        .where(Notificacion.usuario_id == current_user.id, Notificacion.leida == False)
        .values(leida=True)
    )
    await db.commit()
    return {"detail": "Todas las notificaciones marcadas como leídas"}
