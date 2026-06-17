"""
utils/helpers.py
Responsabilidad: Funciones auxiliares generales.
Dependencias: -
Exportaciones: generar_codigo, format_fecha
"""

from datetime import datetime, date


def generar_codigo(prefix: str, numero: int, digits: int = 3) -> str:
    return f"{prefix}-{numero:0{digits}d}"


def format_fecha(dt: datetime | date | None, fmt: str = "%d/%m/%Y") -> str:
    if dt is None:
        return ""
    if isinstance(dt, datetime):
        return dt.strftime(fmt)
    return dt.strftime(fmt)
