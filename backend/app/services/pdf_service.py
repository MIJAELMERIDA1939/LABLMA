"""
services/pdf_service.py
Responsabilidad: Generación de PDF con WeasyPrint y templates Jinja2.
Dependencias: weasyprint, jinja2
Exportaciones: generate_documento_pdf, generate_nc_pdf, generate_lista_maestra_pdf
"""

import os
import json
from datetime import datetime
from jinja2 import Environment, FileSystemLoader


TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates", "pdf")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

TIPOS_DOCUMENTO_CONFIG = {
    "sop": {"label": "Procedimiento Estándar de Operación", "prefijo": "SOP"},
    "pa": {"label": "Procedimiento Analítico", "prefijo": "PA"},
    "procedimiento_operacion": {"label": "Procedimiento Estándar de Operación", "prefijo": "PO"},
    "procedimiento_analitico": {"label": "Procedimiento Analítico", "prefijo": "PA"},
    "instruccion_trabajo": {"label": "Instrucción de Trabajo", "prefijo": "IT"},
    "manual_gestion": {"label": "Manual de Gestión", "prefijo": "MG"},
    "manual_funciones": {"label": "Manual de Funciones", "prefijo": "MF"},
    "documento_externo": {"label": "Documento Externo", "prefijo": "DE"},
    "ficha_tecnica": {"label": "Ficha Técnica", "prefijo": "FT"},
    "formulario": {"label": "Formulario", "prefijo": "FR"},
    "registro": {"label": "Registro", "prefijo": "RG"},
    "int": {"label": "Instrumento", "prefijo": "INT"},
}


def _render_template(template_name: str, context: dict) -> str:
    template = env.get_template(template_name)
    return template.render(**context)


def generate_documento_pdf(doc: dict, version: dict, logo_url: str = None) -> bytes:
    iso_norma = doc.get("iso_norma", [])
    if isinstance(iso_norma, str):
        try:
            iso_norma = json.loads(iso_norma)
        except (json.JSONDecodeError, TypeError):
            iso_norma = [iso_norma] if iso_norma else []

    tipo_config = TIPOS_DOCUMENTO_CONFIG.get(doc.get("tipo", ""), {
        "label": doc.get("tipo", "Documento"),
        "prefijo": "DOC",
    })

    context = {
        "doc": doc,
        "version": version,
        "logo_url": logo_url,
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "fecha_emision": doc.get("fecha_elaboracion", "") or datetime.now().strftime("%Y-%m-%d"),
        "tipo_documento": tipo_config["label"],
        "iso_norma": iso_norma,
        "responsable_emision": doc.get("responsable_emision", "Ing. Karen Ugarteche – RGC"),
        "elaborado": {
            "nombre": doc.get("elaborado_por_nombre", "—"),
            "cargo": doc.get("elaborado_por_cargo", "—"),
            "fecha": doc.get("fecha_elaboracion", "—"),
        },
        "revisado": {
            "nombre": doc.get("verificado_por_nombre", "—"),
            "cargo": doc.get("verificado_por_cargo", "—"),
            "fecha": doc.get("fecha_vigencia", "—"),
        },
        "aprobado": {
            "nombre": doc.get("aprobado_por_nombre", "—"),
            "cargo": doc.get("aprobado_por_cargo", "—"),
            "fecha": doc.get("fecha_vigencia", "—"),
        },
        "page_num": 1,
        "total_pages": 11,
    }

    if doc.get("tipo") == "sop":
        html = _render_template("sop_template.html", context)
    else:
        html = _render_template("documento.html", {
            "doc": doc,
            "version": version,
            "logo_url": logo_url,
            "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
        })

    return _html_to_pdf(html)


def generate_nc_pdf(nc: dict, planes: list[dict] = None, logo_url: str = None) -> bytes:
    html = _render_template("nc_reporte.html", {
        "nc": nc,
        "planes": planes or [],
        "logo_url": logo_url,
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
    })
    return _html_to_pdf(html)


def generate_lista_maestra_pdf(documentos: list[dict], logo_url: str = None) -> bytes:
    html = _render_template("lista_maestra.html", {
        "documentos": documentos,
        "logo_url": logo_url,
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
    })
    return _html_to_pdf(html)


def _html_to_pdf(html: str) -> bytes:
    try:
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except ImportError:
        raise ImportError("WeasyPrint no está instalado. Instálalo con: pip install weasyprint")
