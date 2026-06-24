"""
routers/no_conformidades.py
Responsabilidad: Endpoints CRUD + flujo de No Conformidades.
Dependencias: nc_service, notificacion_service
Endpoints: GET/POST /nc, POST /{id}/analisis, POST /{id}/cerrar, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from app.database import get_db
from app.models.usuario import Usuario
from app.models.no_conformidad import NoConformidad, EstadoNC
from app.models.plan_accion import PlanAccion
from app.schemas.no_conformidad import (
    NCCreate, NCUpdate, NCOut, PlanAccionCreate, PlanAccionUpdate,
    PlanAccionOut, AnalisisInput, CierreInput, ValidarCierreInput,
)
from app.auth.dependencies import get_current_user


class NCPaginatedResponse(BaseModel):
    items: list[NCOut]
    total: int
    limit: int
    offset: int


router = APIRouter(prefix="/nc", tags=["no_conformidades"])


@router.get("", response_model=NCPaginatedResponse)
async def list_nc(
    tipo: str = None,
    estado: str = None,
    responsable_id: str = None,
    desde: str = None,
    hasta: str = None,
    search: str = None,
    limit: int = 15,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = select(NoConformidad).options(selectinload(NoConformidad.planes_accion))
    count_query = select(func.count(NoConformidad.id))

    if tipo:
        query = query.where(NoConformidad.tipo == tipo)
        count_query = count_query.where(NoConformidad.tipo == tipo)
    if estado:
        query = query.where(NoConformidad.estado == estado)
        count_query = count_query.where(NoConformidad.estado == estado)
    if responsable_id:
        query = query.where(NoConformidad.responsable_id == responsable_id)
        count_query = count_query.where(NoConformidad.responsable_id == responsable_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(NoConformidad.codigo.ilike(pattern) | NoConformidad.descripcion.ilike(pattern))
        count_query = count_query.where(NoConformidad.codigo.ilike(pattern) | NoConformidad.descripcion.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(NoConformidad.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    ncs = result.unique().scalars().all()

    return NCPaginatedResponse(items=ncs, total=total, limit=limit, offset=offset)


@router.post("", response_model=NCOut, status_code=status.HTTP_201_CREATED)
async def create_nc(
    body: NCCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    existing = await db.execute(select(NoConformidad).where(NoConformidad.codigo == body.codigo))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Código NC ya existe")

    nc = NoConformidad(**body.model_dump())
    db.add(nc)
    await db.commit()
    await db.refresh(nc)
    return nc


@router.get("/{nc_id}", response_model=NCOut)
async def get_nc(
    nc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")

    planes = await db.execute(select(PlanAccion).where(PlanAccion.nc_id == nc_id))
    nc.planes_accion = planes.scalars().all()
    return nc


@router.put("/{nc_id}", response_model=NCOut)
async def update_nc(
    nc_id: str,
    body: NCUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(nc, key, value)
    await db.commit()
    await db.refresh(nc)
    return nc


@router.post("/{nc_id}/analisis", response_model=NCOut)
async def analisis_nc(
    nc_id: str,
    body: AnalisisInput,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")
    if nc.estado != EstadoNC.abierta:
        raise HTTPException(status_code=400, detail="La NC debe estar en estado abierta")

    nc.analisis_causa = body.analisis_causa
    nc.correccion = body.correccion
    nc.estado = "en_analisis"
    await db.commit()
    await db.refresh(nc)
    return nc


@router.post("/{nc_id}/aprobar-plan", response_model=NCOut)
async def aprobar_plan_nc(
    nc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")
    if nc.estado != EstadoNC.en_analisis:
        raise HTTPException(status_code=400, detail="La NC debe estar en análisis")

    nc.estado = "plan_aprobado"
    nc.aprobador_id = current_user.id
    await db.commit()
    await db.refresh(nc)
    return nc


@router.post("/{nc_id}/cerrar", response_model=NCOut)
async def cerrar_nc(
    nc_id: str,
    body: CierreInput = CierreInput(),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")
    if nc.estado != EstadoNC.en_ejecucion and nc.estado != EstadoNC.plan_aprobado:
        raise HTTPException(status_code=400, detail="La NC debe estar en ejecución o plan aprobado")

    nc.estado = "cerrada"
    from datetime import date
    nc.fecha_cierre = date.today()
    await db.commit()
    await db.refresh(nc)
    return nc


@router.post("/{nc_id}/validar-cierre", response_model=NCOut)
async def validar_cierre(
    nc_id: str,
    body: ValidarCierreInput,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(NoConformidad).where(NoConformidad.id == nc_id))
    nc = result.scalars().first()
    if not nc:
        raise HTTPException(status_code=404, detail="NC no encontrada")
    if nc.estado != EstadoNC.cerrada:
        raise HTTPException(status_code=400, detail="La NC debe estar cerrada")

    nc.eficaz = body.eficaz
    nc.verificador_id = current_user.id
    await db.commit()
    await db.refresh(nc)
    return nc


@router.get("/{nc_id}/planes-accion", response_model=list[PlanAccionOut])
async def list_planes_accion(
    nc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(PlanAccion).where(PlanAccion.nc_id == nc_id).order_by(PlanAccion.created_at)
    )
    return result.scalars().all()


@router.post("/{nc_id}/planes-accion", response_model=PlanAccionOut, status_code=201)
async def create_plan_accion(
    nc_id: str,
    body: PlanAccionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    plan = PlanAccion(nc_id=nc_id, **body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.put("/{nc_id}/planes-accion/{plan_id}", response_model=PlanAccionOut)
async def update_plan_accion(
    nc_id: str,
    plan_id: str,
    body: PlanAccionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(PlanAccion).where(PlanAccion.id == plan_id, PlanAccion.nc_id == nc_id)
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de acción no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)
    await db.commit()
    await db.refresh(plan)
    return plan
