"""
routers/dashboard.py
Responsabilidad: Endpoints para KPIs y estadísticas del dashboard.
Dependencias: fastapi, sqlalchemy
Endpoints: GET /dashboard/kpis, /dashboard/documentos, /dashboard/nc, /dashboard/alertas
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models.usuario import Usuario
from app.models.documento import Documento
from app.models.no_conformidad import NoConformidad
from app.models.riesgo import Riesgo
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=dict)
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    total_docs = await db.scalar(select(func.count(Documento.id)))
    docs_vigentes = await db.scalar(
        select(func.count(Documento.id)).where(Documento.estado == "vigente")
    )
    total_nc = await db.scalar(select(func.count(NoConformidad.id)))
    nc_abiertas = await db.scalar(
        select(func.count(NoConformidad.id)).where(NoConformidad.estado.in_(["abierta", "en_analisis", "en_ejecucion"]))
    )
    nc_vencidas = await db.scalar(
        select(func.count(NoConformidad.id)).where(NoConformidad.estado == "vencida")
    )
    total_riesgos = await db.scalar(select(func.count(Riesgo.id)))
    riesgos_activos = await db.scalar(
        select(func.count(Riesgo.id)).where(Riesgo.estado == "activo")
    )

    return {
        "total_documentos": total_docs or 0,
        "documentos_vigentes": docs_vigentes or 0,
        "total_nc": total_nc or 0,
        "nc_abiertas": nc_abiertas or 0,
        "nc_vencidas": nc_vencidas or 0,
        "total_riesgos": total_riesgos or 0,
        "riesgos_activos": riesgos_activos or 0,
    }


@router.get("/documentos", response_model=dict)
async def get_documentos_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(Documento.tipo, func.count(Documento.id))
        .group_by(Documento.tipo)
    )
    por_tipo = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(Documento.estado, func.count(Documento.id))
        .group_by(Documento.estado)
    )
    por_estado = {row[0]: row[1] for row in result.all()}

    return {"por_tipo": por_tipo, "por_estado": por_estado}


@router.get("/nc", response_model=dict)
async def get_nc_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(NoConformidad.estado, func.count(NoConformidad.id))
        .group_by(NoConformidad.estado)
    )
    por_estado = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(NoConformidad.tipo, func.count(NoConformidad.id))
        .group_by(NoConformidad.tipo)
    )
    por_tipo = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(NoConformidad.responsable_id, func.count(NoConformidad.id))
        .group_by(NoConformidad.responsable_id)
    )
    por_responsable = {str(row[0]): row[1] for row in result.all() if row[0]}

    return {"por_estado": por_estado, "por_tipo": por_tipo, "por_responsable": por_responsable}


@router.get("/alertas", response_model=list[dict])
async def get_alertas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from datetime import date, timedelta
    hoy = date.today()
    en_7_dias = hoy + timedelta(days=7)

    nc_proximas = await db.execute(
        select(NoConformidad)
        .where(
            and_(
                NoConformidad.fecha_limite >= hoy,
                NoConformidad.fecha_limite <= en_7_dias,
                NoConformidad.estado != "cerrada",
            )
        )
        .order_by(NoConformidad.fecha_limite)
    )
    alertas = []
    for nc in nc_proximas.scalars().all():
        alertas.append({
            "tipo": "nc_vencimiento",
            "titulo": f"NC {nc.codigo} vence pronto",
            "mensaje": f"Vence el {nc.fecha_limite} - {nc.descripcion[:100]}",
            "referencia_id": str(nc.id),
            "fecha_limite": str(nc.fecha_limite),
        })

    return alertas
