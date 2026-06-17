"""
routers/edicion.py
Responsabilidad: Endpoints para el módulo de Edición (reemplazo de Word).
Permite crear, editar, importar, exportar documentos con formato enriquecido.
Dependencias: libreoffice_service, documento_service
"""

import os
import json
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from app.models.usuario import Usuario
from app.auth.dependencies import require_permiso
from app.services import libreoffice_service

router = APIRouter(prefix="/edicion", tags=["edicion"])

DOCS_DIR = libreoffice_service.DOCS_DIR
METADATA_FILE = DOCS_DIR / "metadatos.json"


def _ensure_metadata():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    if not METADATA_FILE.exists():
        METADATA_FILE.write_text("[]", encoding="utf-8")


def _cargar_metadatos() -> list[dict]:
    _ensure_metadata()
    try:
        return json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _guardar_metadatos(data: list[dict]):
    _ensure_metadata()
    METADATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


@router.get("/")
async def listar_documentos(
    current_user: Usuario = Depends(require_permiso("edicion_ver")),
):
    docs = _cargar_metadatos()
    docs.reverse()
    return docs


@router.post("/crear")
async def crear_documento(
    titulo: str = Form(...),
    contenido_html: str = Form(""),
    current_user: Usuario = Depends(require_permiso("edicion_crear")),
):
    doc_id = str(uuid.uuid4())
    filename = f"{doc_id}.html"
    filepath = DOCS_DIR / filename

    _ensure_metadata()
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    filepath.write_text(contenido_html or "<h1></h1><p></p>", encoding="utf-8")

    metadatos = _cargar_metadatos()
    now = datetime.now().isoformat()
    entry = {
        "id": doc_id,
        "titulo": titulo,
        "creado_por": current_user.nombre,
        "creado_por_id": current_user.id,
        "created_at": now,
        "updated_at": now,
        "formato": "html",
        "tamano": len(contenido_html),
    }
    metadatos.append(entry)
    _guardar_metadatos(metadatos)

    return entry


@router.get("/{doc_id}")
async def obtener_documento(
    doc_id: str,
    current_user: Usuario = Depends(require_permiso("edicion_ver")),
):
    metadatos = _cargar_metadatos()
    entry = next((d for d in metadatos if d["id"] == doc_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    filepath = DOCS_DIR / f"{doc_id}.html"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Contenido del documento no encontrado")

    contenido = filepath.read_text(encoding="utf-8")
    return {**entry, "contenido_html": contenido}


@router.put("/{doc_id}")
async def guardar_documento(
    doc_id: str,
    titulo: str = Form(...),
    contenido_html: str = Form(...),
    current_user: Usuario = Depends(require_permiso("edicion_editar")),
):
    metadatos = _cargar_metadatos()
    entry = next((d for d in metadatos if d["id"] == doc_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    filepath = DOCS_DIR / f"{doc_id}.html"
    filepath.write_text(contenido_html, encoding="utf-8")

    entry["titulo"] = titulo
    entry["updated_at"] = datetime.now().isoformat()
    entry["tamano"] = len(contenido_html)
    _guardar_metadatos(metadatos)

    return {"detail": "Documento guardado", **entry}


@router.delete("/{doc_id}")
async def eliminar_documento(
    doc_id: str,
    current_user: Usuario = Depends(require_permiso("edicion_eliminar")),
):
    metadatos = _cargar_metadatos()
    entry = next((d for d in metadatos if d["id"] == doc_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    metadatos = [d for d in metadatos if d["id"] != doc_id]
    _guardar_metadatos(metadatos)

    filepath = DOCS_DIR / f"{doc_id}.html"
    if filepath.exists():
        filepath.unlink()

    return {"detail": "Documento eliminado"}


@router.post("/{doc_id}/exportar")
async def exportar_documento(
    doc_id: str,
    formato: str = Form("pdf"),
    current_user: Usuario = Depends(require_permiso("edicion_exportar")),
):
    metadatos = _cargar_metadatos()
    entry = next((d for d in metadatos if d["id"] == doc_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    filepath = DOCS_DIR / f"{doc_id}.html"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Contenido no encontrado")

    if not libreoffice_service.esta_instalado():
        raise HTTPException(
            status_code=400,
            detail="LibreOffice no está instalado. Descárgalo desde https://www.libreoffice.org/download/",
        )

    try:
        html_content = filepath.read_text(encoding="utf-8")
        ruta_salida = libreoffice_service.html_a_docx(html_content, entry["titulo"])

        if formato == "pdf":
            ruta_salida = libreoffice_service.html_a_pdf(html_content, entry["titulo"])
        elif formato == "odt":
            ruta_tmp = libreoffice_service.html_a_docx(html_content, entry["titulo"])
            ruta_salida = libreoffice_service.convertir_documento(ruta_tmp, "odt")
            if os.path.isfile(ruta_tmp):
                os.remove(ruta_tmp)
        elif formato == "docx":
            pass
        else:
            raise HTTPException(status_code=400, detail=f"Formato no soportado: {formato}")

        media_type_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "odt": "application/vnd.oasis.opendocument.text",
        }

        return FileResponse(
            path=ruta_salida,
            filename=f"{entry['titulo']}.{formato}",
            media_type=media_type_map.get(formato, "application/octet-stream"),
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/importar")
async def importar_documento(
    archivo: UploadFile = File(...),
    current_user: Usuario = Depends(require_permiso("edicion_importar")),
):
    if not archivo.filename:
        raise HTTPException(status_code=400, detail="No se proporcionó archivo")

    ext = Path(archivo.filename).suffix.lower()
    allowed = [".docx", ".odt", ".html", ".htm", ".rtf", ".txt"]

    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {ext}. Permitidos: {', '.join(allowed)}")

    doc_id = str(uuid.uuid4())
    upload_path = DOCS_DIR / f"{doc_id}{ext}"

    _ensure_metadata()
    with open(upload_path, "wb") as f:
        content = await archivo.read()
        f.write(content)

    titulo = Path(archivo.filename).stem
    contenido_html = ""

    if ext in (".docx", ".odt"):
        if not libreoffice_service.esta_instalado():
            raise HTTPException(
                status_code=400,
                detail="LibreOffice no está instalado. Descárgalo desde https://www.libreoffice.org/download/",
            )
        try:
            contenido_html = libreoffice_service.docx_a_html(str(upload_path))
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        upload_path.unlink(missing_ok=True)
    elif ext in (".html", ".htm"):
        contenido_html = upload_path.read_text(encoding="utf-8")
        upload_path.unlink(missing_ok=True)
    elif ext == ".rtf":
        if not libreoffice_service.esta_instalado():
            raise HTTPException(status_code=400, detail="LibreOffice no está instalado")
        try:
            contenido_html = libreoffice_service.docx_a_html(str(upload_path))
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        upload_path.unlink(missing_ok=True)
    elif ext == ".txt":
        contenido_html = f"<pre>{upload_path.read_text(encoding='utf-8')}</pre>"
        upload_path.unlink(missing_ok=True)

    html_path = DOCS_DIR / f"{doc_id}.html"
    html_path.write_text(contenido_html, encoding="utf-8")

    now = datetime.now().isoformat()
    entry = {
        "id": doc_id,
        "titulo": titulo,
        "creado_por": current_user.nombre,
        "creado_por_id": current_user.id,
        "created_at": now,
        "updated_at": now,
        "formato": "html",
        "tamano": len(contenido_html),
    }
    metadatos = _cargar_metadatos()
    metadatos.append(entry)
    _guardar_metadatos(metadatos)

    return {**entry, "contenido_html": contenido_html}


@router.get("/libreoffice/status")
async def estado_libreoffice(
    current_user: Usuario = Depends(require_permiso("edicion_ver")),
):
    return {"instalado": libreoffice_service.esta_instalado()}
