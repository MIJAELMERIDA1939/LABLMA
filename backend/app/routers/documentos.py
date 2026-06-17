"""
routers/documentos.py
Responsabilidad: Endpoints CRUD + workflow de aprobación + auto-save.
Dependencias: documento_service, pdf_service, notificacion_service
Endpoints: GET/POST /documentos, POST /{id}/enviar-revision|aprobar|rechazar, PUT /{id}/auto-save
"""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.usuario import Usuario
from app.models.documento import Documento
from app.models.version_documento import VersionDocumento
from app.models.historial_documento import HistorialDocumento
from app.schemas.documento import DocumentoCreate, DocumentoUpdate, DocumentoOut, DocumentoDetailOut, VersionOut, PaginatedResponse
from app.schemas.workflow import EnviarRevision, AprobarDocumento, RechazarDocumento, AutoSaveRequest, HistorialOut, WorkflowState
from app.auth.dependencies import get_current_user
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/documentos", tags=["documentos"])


async def _registrar_historial(
    db: AsyncSession,
    documento_id: str,
    usuario_id: str,
    accion: str,
    estado_anterior: str = None,
    estado_nuevo: str = None,
    comentario: str = None,
    version_numero: str = None,
):
    historial = HistorialDocumento(
        documento_id=documento_id,
        usuario_id=usuario_id,
        accion=accion,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        comentario=comentario,
        version_numero=version_numero,
    )
    db.add(historial)


@router.get("/", response_model=PaginatedResponse)
async def list_documentos(
    tipo: str = None,
    iso_norma: str = None,
    estado: str = None,
    search: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = select(Documento)
    count_query = select(func.count(Documento.id))

    if tipo:
        query = query.where(Documento.tipo == tipo)
        count_query = count_query.where(Documento.tipo == tipo)
    if iso_norma:
        query = query.where(Documento.iso_norma.ilike(f"%{iso_norma}%"))
        count_query = count_query.where(Documento.iso_norma.ilike(f"%{iso_norma}%"))
    if estado:
        query = query.where(Documento.estado == estado)
        count_query = count_query.where(Documento.estado == estado)
    if search:
        pattern = f"%{search}%"
        query = query.where(Documento.titulo.ilike(pattern) | Documento.codigo.ilike(pattern))
        count_query = count_query.where(Documento.titulo.ilike(pattern) | Documento.codigo.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Documento.codigo).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/", response_model=DocumentoOut, status_code=status.HTTP_201_CREATED)
async def create_documento(
    body: DocumentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    existing = await db.execute(select(Documento).where(Documento.codigo == body.codigo))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Código de documento ya existe")

    doc = Documento(
        codigo=body.codigo,
        titulo=body.titulo,
        tipo=body.tipo,
        iso_norma=json.dumps(body.iso_norma),
        estado="borrador",
        elaborador_id=current_user.id,
        acceso_roles=body.acceso_roles,
        fecha_elaboracion=datetime.now().date(),
    )
    db.add(doc)
    await db.flush()

    version = VersionDocumento(
        documento_id=doc.id,
        numero_version=1,
        contenido_html=body.contenido_html,
        autor_id=current_user.id,
        estado="borrador",
    )
    db.add(version)

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="crear",
        estado_nuevo="borrador",
        comentario="Documento creado",
        version_numero="1",
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=DocumentoDetailOut)
async def get_documento(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(Documento).where(Documento.id == doc_id).options(selectinload(Documento.versiones))
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return doc


@router.put("/{doc_id}", response_model=DocumentoOut)
async def update_documento(
    doc_id: str,
    body: DocumentoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if doc.estado not in ("borrador",):
        raise HTTPException(status_code=400, detail="Solo se puede editar en estado borrador")

    update_data = body.model_dump(exclude_unset=True)
    contenido = update_data.pop("contenido_html", None)
    iso_norma = update_data.pop("iso_norma", None)

    for key, value in update_data.items():
        setattr(doc, key, value)

    if iso_norma is not None:
        doc.iso_norma = json.dumps(iso_norma)

    if contenido is not None:
        version_result = await db.execute(
            select(VersionDocumento).where(
                VersionDocumento.documento_id == doc_id,
                VersionDocumento.numero_version == doc.version_actual,
            )
        )
        version = version_result.scalars().first()
        if version:
            version.contenido_html = contenido

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="editar",
        estado_anterior=doc.estado,
        estado_nuevo=doc.estado,
        comentario="Documento editado",
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.put("/{doc_id}/auto-save", response_model=DocumentoOut)
async def auto_save_documento(
    doc_id: str,
    body: AutoSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if doc.estado not in ("borrador",):
        raise HTTPException(status_code=400, detail="Solo se puede editar en estado borrador")

    if body.titulo is not None:
        doc.titulo = body.titulo

    version_result = await db.execute(
        select(VersionDocumento).where(
            VersionDocumento.documento_id == doc_id,
            VersionDocumento.numero_version == doc.version_actual,
        )
    )
    version = version_result.scalars().first()
    if version:
        version.contenido_html = body.contenido_html

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="auto_save",
        estado_anterior=doc.estado,
        estado_nuevo=doc.estado,
        comentario="Guardado automático",
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/{doc_id}/enviar-revision", response_model=DocumentoOut)
async def enviar_revision(
    doc_id: str,
    body: EnviarRevision = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if doc.estado != "borrador":
        raise HTTPException(status_code=400, detail="El documento debe estar en borrador")
    if doc.elaborador_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Solo el elaborador puede enviar a revisión")

    estado_anterior = doc.estado
    doc.estado = "en_revision"
    doc.revisor_id = current_user.id
    doc.fecha_revision = datetime.now()

    comentario = body.comentario if body else None
    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="enviar_revision",
        estado_anterior=estado_anterior,
        estado_nuevo="en_revision",
        comentario=comentario or "Documento enviado a revisión",
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/{doc_id}/aprobar", response_model=DocumentoOut)
async def aprobar_documento(
    doc_id: str,
    body: AprobarDocumento = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if doc.estado == "en_revision":
        if doc.revisor_id and str(doc.revisor_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Solo el revisor asignado puede aprobar la revisión")
        estado_anterior = doc.estado
        doc.estado = "en_aprobacion"
        doc.aprobador_id = current_user.id
        accion = "aprobar_revision"
        comentario = body.comentario if body else "Revisión aprobada"
    elif doc.estado == "en_aprobacion":
        if doc.aprobador_id and str(doc.aprobador_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Solo el aprobador asignado puede aprobar")
        estado_anterior = doc.estado
        doc.estado = "vigente"
        doc.fecha_aprobacion = datetime.now()
        accion = "aprobar"
        comentario = body.comentario if body else "Documento aprobado"

        version_result = await db.execute(
            select(VersionDocumento).where(
                VersionDocumento.documento_id == doc_id,
                VersionDocumento.numero_version == doc.version_actual,
            )
        )
        version = version_result.scalars().first()
        if version:
            version.estado = "vigente"
    else:
        raise HTTPException(status_code=400, detail="El documento no está en un estado que permita aprobación")

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion=accion,
        estado_anterior=estado_anterior,
        estado_nuevo=doc.estado,
        comentario=comentario,
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/{doc_id}/rechazar", response_model=DocumentoOut)
async def rechazar_documento(
    doc_id: str,
    body: RechazarDocumento,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if doc.estado not in ("en_revision", "en_aprobacion"):
        raise HTTPException(status_code=400, detail="El documento debe estar en revisión o aprobación")

    estado_anterior = doc.estado
    doc.estado = "borrador"
    doc.motivo_rechazo = body.motivo
    doc.fecha_revision = None
    doc.fecha_aprobacion = None

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="rechazar",
        estado_anterior=estado_anterior,
        estado_nuevo="borrador",
        comentario=f"Rechazado: {body.motivo}",
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/{doc_id}/dar-de-baja", response_model=DocumentoOut)
async def dar_de_baja(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if doc.estado != "vigente":
        raise HTTPException(status_code=400, detail="Solo se puede dar de baja documentos vigentes")

    estado_anterior = doc.estado
    doc.estado = "obsoleto"
    doc.fecha_obsoleto = datetime.now().date()

    await _registrar_historial(
        db, doc.id, current_user.id,
        accion="dar_de_baja",
        estado_anterior=estado_anterior,
        estado_nuevo="obsoleto",
        comentario="Documento dado de baja",
        version_numero=str(doc.version_actual),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{doc_id}/workflow", response_model=WorkflowState)
async def get_workflow_state(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    elaborador_nombre = None
    revisor_nombre = None
    aprobador_nombre = None

    if doc.elaborador_id:
        u = await db.execute(select(Usuario).where(Usuario.id == doc.elaborador_id))
        usuario = u.scalars().first()
        elaborador_nombre = usuario.nombre if usuario else None
    if doc.revisor_id:
        u = await db.execute(select(Usuario).where(Usuario.id == doc.revisor_id))
        usuario = u.scalars().first()
        revisor_nombre = usuario.nombre if usuario else None
    if doc.aprobador_id:
        u = await db.execute(select(Usuario).where(Usuario.id == doc.aprobador_id))
        usuario = u.scalars().first()
        aprobador_nombre = usuario.nombre if usuario else None

    acciones = []
    is_elaborador = doc.elaborador_id and str(doc.elaborador_id) == str(current_user.id)
    is_revisor = doc.revisor_id and str(doc.revisor_id) == str(current_user.id)
    is_aprobador = doc.aprobador_id and str(doc.aprobador_id) == str(current_user.id)

    if doc.estado == "borrador" and is_elaborador:
        acciones.append("enviar_revision")
    if doc.estado == "en_revision" and is_revisor:
        acciones.extend(["aprobar", "rechazar"])
    if doc.estado == "en_aprobacion" and is_aprobador:
        acciones.extend(["aprobar", "rechazar"])
    if doc.estado == "vigente":
        acciones.append("dar_de_baja")

    return WorkflowState(
        documento_id=doc.id,
        estado=doc.estado,
        elaborador_id=doc.elaborador_id,
        elaborador_nombre=elaborador_nombre,
        revisor_id=doc.revisor_id,
        revisor_nombre=revisor_nombre,
        aprobador_id=doc.aprobador_id,
        aprobador_nombre=aprobador_nombre,
        fecha_elaboracion=str(doc.fecha_elaboracion) if doc.fecha_elaboracion else None,
        fecha_revision=str(doc.fecha_revision) if doc.fecha_revision else None,
        fecha_aprobacion=str(doc.fecha_aprobacion) if doc.fecha_aprobacion else None,
        motivo_rechazo=doc.motivo_rechazo,
        acciones_disponibles=acciones,
    )


@router.get("/{doc_id}/historial", response_model=list[HistorialOut])
async def get_historial(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(HistorialDocumento)
        .where(HistorialDocumento.documento_id == doc_id)
        .order_by(HistorialDocumento.created_at.desc())
    )
    items = result.scalars().all()

    historial = []
    for item in items:
        u = await db.execute(select(Usuario).where(Usuario.id == item.usuario_id))
        usuario = u.scalars().first()
        historial.append(HistorialOut(
            id=item.id,
            usuario_id=item.usuario_id,
            usuario_nombre=usuario.nombre if usuario else "Desconocido",
            accion=item.accion,
            estado_anterior=item.estado_anterior,
            estado_nuevo=item.estado_nuevo,
            comentario=item.comentario,
            version_numero=item.version_numero,
            created_at=item.created_at,
        ))

    return historial


@router.get("/{doc_id}/versiones", response_model=list[VersionOut])
async def list_versiones(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(VersionDocumento)
        .where(VersionDocumento.documento_id == doc_id)
        .order_by(VersionDocumento.numero_version.desc())
    )
    return result.scalars().all()
