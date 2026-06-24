"""
main.py
Responsabilidad: Entry point de la aplicación FastAPI. Configura CORS, routers, y scheduler.
Dependencias: fastapi, routers, scheduler_service, config
Endpoints: Monta todos los routers bajo /api/v1
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import (
    usuarios_router,
    documentos_router,
    nc_router,
    riesgos_router,
    planes_router,
    dashboard_router,
    notificaciones_router,
    edicion_router,
)
from app.auth.router import router as auth_router
from app.services.scheduler_service import iniciar_scheduler, detener_scheduler, ejecutar_tareas


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "production":
        iniciar_scheduler()
    yield
    if settings.ENVIRONMENT == "production":
        detener_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

if settings.ENVIRONMENT == "production":
    origins = ["*"]
else:
    origins = [settings.FRONTEND_URL, "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=(settings.ENVIRONMENT != "production"),
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(usuarios_router, prefix=API_PREFIX)
app.include_router(documentos_router, prefix=API_PREFIX)
app.include_router(nc_router, prefix=API_PREFIX)
app.include_router(riesgos_router, prefix=API_PREFIX)
app.include_router(planes_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(notificaciones_router, prefix=API_PREFIX)
app.include_router(edicion_router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": "1.0.0", "status": "running"}


@app.get("/api/v1/scheduler/run-jobs")
async def run_scheduler_jobs(cron_secret: str = ""):
    if cron_secret != settings.CRON_SECRET:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    await ejecutar_tareas()
    return {"detail": "Jobs ejecutados correctamente"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno del servidor: {str(exc)}"},
    )
