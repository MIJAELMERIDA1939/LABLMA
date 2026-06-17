"""
services/scheduler_service.py
Responsabilidad: Tareas programadas con APScheduler para alertas automáticas.
Dependencias: apscheduler, database, models, notificacion_service
Exportaciones: iniciar_scheduler, detener_scheduler, ejecutar_tareas
"""

from datetime import datetime, date, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, and_
from app.database import async_session_maker
from app.models.no_conformidad import NoConformidad, EstadoNC
from app.models.tarea_plan import TareaPlan, EstadoTarea
from app.models.documento import Documento
from app.models.notificacion import TipoNotificacion
from app.services.notificacion_service import crear_notificacion

scheduler = AsyncIOScheduler()
TAREA_NC_VENCIMIENTO = "nc_vencimiento"
TAREA_TAREAS_VENCIMIENTO = "tareas_vencimiento"
TAREA_MARCAR_VENCIDAS = "marcar_vencidas"
TAREA_DOCS_PENDIENTES = "docs_pendientes"


async def _revisar_nc_proximas():
    async with async_session_maker() as db:
        hoy = date.today()
        en_3_dias = hoy + timedelta(days=3)

        result = await db.execute(
            select(NoConformidad).where(
                and_(
                    NoConformidad.fecha_limite == en_3_dias,
                    NoConformidad.estado != "cerrada",
                )
            )
        )
        for nc in result.scalars().all():
            await crear_notificacion(
                db,
                str(nc.responsable_id) if nc.responsable_id else "",
                TipoNotificacion.alerta_vencimiento,
                f"NC {nc.codigo} vence en 3 días",
                f"La NC {nc.codigo} tiene fecha límite el {nc.fecha_limite}",
                "nc",
                str(nc.id),
            )


async def _revisar_tareas_proximas():
    async with async_session_maker() as db:
        hoy = date.today()
        en_3_dias = hoy + timedelta(days=3)

        result = await db.execute(
            select(TareaPlan).where(
                and_(
                    TareaPlan.fecha_fin == en_3_dias,
                    TareaPlan.estado != "completada",
                )
            )
        )
        for tarea in result.scalars().all():
            await crear_notificacion(
                db,
                str(tarea.responsable_id) if tarea.responsable_id else "",
                TipoNotificacion.alerta_vencimiento,
                f"Tarea '{tarea.nombre}' vence en 3 días",
                f"La tarea tiene fecha límite el {tarea.fecha_fin}",
                "tarea",
                str(tarea.id),
            )


async def _marcar_vencidas():
    async with async_session_maker() as db:
        hoy = date.today()

        result = await db.execute(
            select(NoConformidad).where(
                and_(
                    NoConformidad.fecha_limite < hoy,
                    NoConformidad.estado.notin_(["cerrada", "vencida"]),
                )
            )
        )
        for nc in result.scalars().all():
            nc.estado = EstadoNC.vencida

        result = await db.execute(
            select(TareaPlan).where(
                and_(
                    TareaPlan.fecha_fin < hoy,
                    TareaPlan.estado.notin_(["completada", "vencida"]),
                )
            )
        )
        for tarea in result.scalars().all():
            tarea.estado = EstadoTarea.vencida

        await db.commit()


async def _revisar_docs_pendientes():
    async with async_session_maker() as db:
        result = await db.execute(
            select(Documento).where(Documento.estado == "en_revision")
        )
        for doc in result.scalars().all():
            if doc.aprobado_por:
                await crear_notificacion(
                    db,
                    str(doc.aprobado_por),
                    TipoNotificacion.pendiente_aprobacion,
                    f"Documento {doc.codigo} pendiente de aprobación",
                    f"El documento {doc.titulo} ({doc.codigo}) está esperando aprobación",
                    "documento",
                    str(doc.id),
                )


async def ejecutar_tareas():
    await _revisar_nc_proximas()
    await _revisar_tareas_proximas()
    await _marcar_vencidas()
    await _revisar_docs_pendientes()


def iniciar_scheduler():
    scheduler.add_job(_revisar_nc_proximas, "cron", hour=8, minute=0, id=TAREA_NC_VENCIMIENTO)
    scheduler.add_job(_revisar_tareas_proximas, "cron", hour=8, minute=5, id=TAREA_TAREAS_VENCIMIENTO)
    scheduler.add_job(_marcar_vencidas, "cron", hour=0, minute=0, id=TAREA_MARCAR_VENCIDAS)
    scheduler.add_job(_revisar_docs_pendientes, "cron", hour=8, minute=10, id=TAREA_DOCS_PENDIENTES)
    scheduler.start()


def detener_scheduler():
    scheduler.shutdown(wait=False)
