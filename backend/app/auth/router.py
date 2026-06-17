"""
auth/router.py
Responsabilidad: Endpoints de autenticación: login, me, refresh.
Dependencias: fastapi, auth/service.py, auth/schemas.py
Endpoints: POST /auth/login, GET /auth/me, POST /auth/refresh
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.schemas import LoginRequest, TokenResponse, UserOut
from app.auth.service import authenticate_user, create_access_token, decode_token
from app.auth.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol})
    return TokenResponse(access_token=access_token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: Usuario = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    from sqlalchemy import select
    result = await db.execute(select(Usuario).where(Usuario.id == payload.get("sub")))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    new_token = create_access_token(data={"sub": str(user.id), "rol": user.rol})
    return TokenResponse(access_token=new_token, user=UserOut.model_validate(user))
