"""
services/notificacion_service.py
Responsabilidad: Dispatcher de notificaciones: in-app, email y WhatsApp.
Dependencias: models, email_service, whatsapp_service
Exportaciones: crear_notificacion, notificar_nc, notificar_documento
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notificacion import Notificacion
from app.services.email_service import send_email
from app.services.whatsapp_service import send_whatsapp
from app.config import settings


async def crear_notificacion(
    db: AsyncSession,
    usuario_id: str,
    tipo: str,
    titulo: str,
    mensaje: str = None,
    referencia_tipo: str = None,
    referencia_id: str = None,
) -> Notificacion:
    notif = Notificacion(
        usuario_id=usuario_id,
        tipo=tipo.value if hasattr(tipo, "value") else tipo,
        titulo=titulo,
        mensaje=mensaje,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
        canal_enviado=["in_app"],
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def notificar_nc(
    db: AsyncSession,
    usuario_id: str,
    nc_codigo: str,
    nc_id: str,
    email: str = None,
    telefono: str = None,
):
    titulo = f"NC {nc_codigo} asignada"
    mensaje = f"Se te ha asignado la No Conformidad {nc_codigo}. Revisa el sistema para más detalles."
    notif = await crear_notificacion(db, usuario_id, TipoNotificacion.nc_asignada, titulo, mensaje, "nc", nc_id)

    canales = ["in_app"]
    if email and settings.SMTP_HOST:
        try:
            await send_email(email, titulo, mensaje)
            canales.append("email")
        except Exception:
            pass
    if telefono and settings.WHATSAPP_TOKEN:
        try:
            await send_whatsapp(telefono, f"{titulo}: {mensaje}")
            canales.append("whatsapp")
        except Exception:
            pass

    notif.canal_enviado = canales
    await db.commit()
    return notif


async def notificar_documento(
    db: AsyncSession,
    usuario_id: str,
    doc_codigo: str,
    doc_id: str,
    estado: str,
    email: str = None,
    telefono: str = None,
):
    titulo = f"Documento {doc_codigo} - {estado}"
    mensaje = f"El documento {doc_codigo} ha cambiado a estado: {estado}."
    notif = await crear_notificacion(db, usuario_id, TipoNotificacion.pendiente_aprobacion, titulo, mensaje, "documento", doc_id)

    canales = ["in_app"]
    if email and settings.SMTP_HOST:
        try:
            await send_email(email, titulo, mensaje)
            canales.append("email")
        except Exception:
            pass
    if telefono and settings.WHATSAPP_TOKEN:
        try:
            await send_whatsapp(telefono, f"{titulo}: {mensaje}")
            canales.append("whatsapp")
        except Exception:
            pass

    notif.canal_enviado = canales
    await db.commit()
    return notif
