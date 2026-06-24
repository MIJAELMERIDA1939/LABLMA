"""
routers/riesgos.py
Responsabilidad: Endpoints CRUD para la matriz de riesgos.
Dependencias: fastapi, sqlalchemy, models
Endpoints: GET/POST/PUT /riesgos, GET /riesgos/matriz
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from pydantic import BaseModel
from app.database import get_db
from app.models.usuario import Usuario
from app.models.riesgo import Riesgo
from app.schemas.riesgo import RiesgoCreate, RiesgoUpdate, RiesgoOut
from app.auth.dependencies import get_current_user


class RiesgoPaginatedResponse(BaseModel):
    items: list[RiesgoOut]
    total: int
    limit: int
    offset: int

router = APIRouter(prefix="/riesgos", tags=["riesgos"])


@router.get("", response_model=RiesgoPaginatedResponse)
async def list_riesgos(
    estado: str = None,
    search: str = None,
    limit: int = 15,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = select(Riesgo)
    count_query = select(func.count(Riesgo.id))

    if estado:
        query = query.where(Riesgo.estado == estado)
        count_query = count_query.where(Riesgo.estado == estado)
    if search:
        pattern = f"%{search}%"
        query = query.where(Riesgo.codigo.ilike(pattern) | Riesgo.descripcion.ilike(pattern) | Riesgo.proceso.ilike(pattern))
        count_query = count_query.where(Riesgo.codigo.ilike(pattern) | Riesgo.descripcion.ilike(pattern) | Riesgo.proceso.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Riesgo.codigo).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return RiesgoPaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=RiesgoOut, status_code=201)
async def create_riesgo(
    body: RiesgoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    existing = await db.execute(select(Riesgo).where(Riesgo.codigo == body.codigo))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Código de riesgo ya existe")

    riesgo = Riesgo(**body.model_dump())
    db.add(riesgo)
    await db.commit()
    await db.refresh(riesgo)
    return riesgo


@router.get("/{riesgo_id}", response_model=RiesgoOut)
async def get_riesgo(
    riesgo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Riesgo).where(Riesgo.id == riesgo_id))
    riesgo = result.scalars().first()
    if not riesgo:
        raise HTTPException(status_code=404, detail="Riesgo no encontrado")
    return riesgo


@router.put("/{riesgo_id}", response_model=RiesgoOut)
async def update_riesgo(
    riesgo_id: str,
    body: RiesgoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(select(Riesgo).where(Riesgo.id == riesgo_id))
    riesgo = result.scalars().first()
    if not riesgo:
        raise HTTPException(status_code=404, detail="Riesgo no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(riesgo, key, value)
    await db.commit()
    await db.refresh(riesgo)
    return riesgo


@router.get("/matriz", response_model=list[dict])
async def get_matriz(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(
            Riesgo.id,
            Riesgo.codigo,
            Riesgo.proceso,
            Riesgo.probabilidad,
            Riesgo.impacto,
            Riesgo.estado,
            (Riesgo.probabilidad * Riesgo.impacto).label("nivel_riesgo"),
            Riesgo.descripcion,
            Riesgo.tipo_tratamiento,
        ).order_by(text("nivel_riesgo DESC"))
    )
    rows = result.all()
    return [
        {
            "id": str(r.id),
            "codigo": r.codigo,
            "proceso": r.proceso,
            "probabilidad": r.probabilidad,
            "impacto": r.impacto,
            "nivel_riesgo": r.nivel_riesgo,
            "estado": r.estado,
            "descripcion": r.descripcion,
            "tipo_tratamiento": r.tipo_tratamiento,
        }
        for r in rows
    ]
