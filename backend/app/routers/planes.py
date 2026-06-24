"""
routers/planes.py
Responsabilidad: Endpoints CRUD para Planes/Programas y tareas (Gantt).
Dependencias: fastapi, sqlalchemy, models
Endpoints: GET/POST/PUT /planes, GET/POST /planes/{id}/tareas
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from app.database import get_db
from app.models.usuario import Usuario
from app.models.plan_programa import PlanPrograma
from app.models.tarea_plan import TareaPlan
from app.schemas.plan_programa import PlanCreate, PlanUpdate, PlanOut, TareaCreate, TareaUpdate, TareaOut
from app.auth.dependencies import get_current_user


class PlanPaginatedResponse(BaseModel):
    items: list[PlanOut]
    total: int
    limit: int
    offset: int

router = APIRouter(prefix="/planes", tags=["planes"])


@router.get("", response_model=PlanPaginatedResponse)
async def list_planes(
    estado: str = None,
    iso_norma: str = None,
    search: str = None,
    limit: int = 15,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = select(PlanPrograma).options(selectinload(PlanPrograma.tareas))
    count_query = select(func.count(PlanPrograma.id))

    if estado:
        query = query.where(PlanPrograma.estado == estado)
        count_query = count_query.where(PlanPrograma.estado == estado)
    if iso_norma:
        query = query.where(PlanPrograma.iso_norma == iso_norma)
        count_query = count_query.where(PlanPrograma.iso_norma == iso_norma)
    if search:
        pattern = f"%{search}%"
        query = query.where(PlanPrograma.titulo.ilike(pattern))
        count_query = count_query.where(PlanPrograma.titulo.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(PlanPrograma.ano.desc(), PlanPrograma.titulo).offset(offset).limit(limit)
    result = await db.execute(query)
    planes = result.unique().scalars().all()

    return PlanPaginatedResponse(items=planes, total=total, limit=limit, offset=offset)


@router.post("", response_model=PlanOut, status_code=201)
async def create_plan(
    body: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    plan = PlanPrograma(
        titulo=body.titulo,
        iso_norma=body.iso_norma,
        ano=body.ano,
        elaborado_por=body.elaborado_por or current_user.id,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=PlanOut)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(PlanPrograma).where(PlanPrograma.id == plan_id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    tareas = await db.execute(select(TareaPlan).where(TareaPlan.plan_id == plan_id))
    plan.tareas = tareas.scalars().all()
    return plan


@router.put("/{plan_id}", response_model=PlanOut)
async def update_plan(
    plan_id: str,
    body: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(PlanPrograma).where(PlanPrograma.id == plan_id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.post("/{plan_id}/aprobar", response_model=PlanOut)
async def aprobar_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(PlanPrograma).where(PlanPrograma.id == plan_id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    plan.estado = "aprobado"
    plan.aprobado_por = current_user.id
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}/tareas", response_model=list[TareaOut])
async def list_tareas(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(TareaPlan).where(TareaPlan.plan_id == plan_id).order_by(TareaPlan.fecha_inicio)
    )
    return result.scalars().all()


@router.post("/{plan_id}/tareas", response_model=TareaOut, status_code=201)
async def create_tarea(
    plan_id: str,
    body: TareaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    tarea = TareaPlan(plan_id=plan_id, **body.model_dump())
    db.add(tarea)
    await db.commit()
    await db.refresh(tarea)
    return tarea


@router.put("/{plan_id}/tareas/{tarea_id}", response_model=TareaOut)
async def update_tarea(
    plan_id: str,
    tarea_id: str,
    body: TareaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(TareaPlan).where(TareaPlan.id == tarea_id, TareaPlan.plan_id == plan_id)
    )
    tarea = result.scalars().first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tarea, key, value)
    await db.commit()
    await db.refresh(tarea)
    return tarea
