"""
services/libreoffice_service.py
Responsabilidad: Integración con LibreOffice para conversión de formatos de documentos.
Soporta conversiones entre HTML, DOCX, ODT, PDF.
"""

import os
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Optional


LIBREOFFICE_PATHS = [
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    r"/usr/bin/libreoffice",
    r"/usr/local/bin/libreoffice",
    r"/snap/bin/libreoffice",
]

DOCS_DIR = Path(os.environ.get("SGC_DOCS_EDICION_DIR", str(Path(__file__).resolve().parent.parent.parent / "documentos_edicion")))


def _find_soffice() -> Optional[str]:
    for path in LIBREOFFICE_PATHS:
        if os.path.isfile(path):
            return path
    if os.name == "nt":
        try:
            result = subprocess.run(["where", "soffice"], capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                return result.stdout.strip().split("\n")[0]
        except FileNotFoundError:
            pass
    else:
        try:
            result = subprocess.run(["which", "libreoffice"], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except FileNotFoundError:
            pass
    return None


def _ensure_docs_dir():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)


def convertir_documento(origen_path: str, formato_destino: str, timeout: int = 60) -> Optional[str]:
    soffice = _find_soffice()
    if not soffice:
        raise RuntimeError("LibreOffice no está instalado. Instálalo desde https://www.libreoffice.org/download/")

    if not os.path.isfile(origen_path):
        raise FileNotFoundError(f"Archivo origen no encontrado: {origen_path}")

    dir_salida = tempfile.mkdtemp()

    try:
        result = subprocess.run(
            [soffice, "--headless", "--convert-to", formato_destino, "--outdir", dir_salida, origen_path],
            capture_output=True, text=True, timeout=timeout
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() or "Error desconocido en LibreOffice"
            raise RuntimeError(f"Error en conversión LibreOffice: {error_msg}")

        archivos = os.listdir(dir_salida)
        if not archivos:
            raise RuntimeError("No se generó archivo de salida")

        ruta_salida = os.path.join(dir_salida, archivos[0])
        nombre_base = Path(origen_path).stem
        extension = _map_formato(formato_destino)
        nombre_final = f"{nombre_base}.{extension}"
        ruta_final = os.path.join(DOCS_DIR, nombre_final)

        _ensure_docs_dir()
        if os.path.isfile(ruta_final):
            os.remove(ruta_final)
        shutil.move(ruta_salida, ruta_final)

        shutil.rmtree(dir_salida, ignore_errors=True)
        return ruta_final

    except subprocess.TimeoutExpired:
        shutil.rmtree(dir_salida, ignore_errors=True)
        raise RuntimeError(f"Conversión agotó el tiempo de espera ({timeout}s)")
    except Exception:
        shutil.rmtree(dir_salida, ignore_errors=True)
        raise


def html_a_docx(html_content: str, nombre_base: str = "documento") -> str:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        html_path = f.name

    try:
        return convertir_documento(html_path, "docx")
    finally:
        if os.path.isfile(html_path):
            os.remove(html_path)


def html_a_pdf(html_content: str, nombre_base: str = "documento") -> str:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        html_path = f.name

    try:
        return convertir_documento(html_path, "pdf")
    finally:
        if os.path.isfile(html_path):
            os.remove(html_path)


def docx_a_html(ruta_docx: str) -> str:
    ruta_html = convertir_documento(ruta_docx, "html")

    try:
        with open(ruta_html, "r", encoding="utf-8") as f:
            html = f.read()
        return html
    finally:
        if ruta_html and os.path.isfile(ruta_html):
            os.remove(ruta_html)


def esta_instalado() -> bool:
    return _find_soffice() is not None


def _map_formato(formato: str) -> str:
    mapping = {
        "pdf": "pdf",
        "docx": "docx",
        "odt": "odt",
        "html": "html",
        "txt": "txt",
        "rtf": "rtf",
    }
    return mapping.get(formato, formato)
