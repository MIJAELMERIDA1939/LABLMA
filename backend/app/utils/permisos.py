"""
utils/permisos.py
Responsabilidad: Matriz de roles y permisos del sistema.
Dependencias: models/usuario.py
Exportaciones: ROLES_PRODUCCION, tiene_permiso
"""

ROLES_PRODUCCION = {
    "admin": {
        "elaborar": True,
        "verificar": True,
        "aprobar": True,
        "ver_todo": True,
        "admin_sistema": True,
        "edicion_ver": True,
        "edicion_crear": True,
        "edicion_editar": True,
        "edicion_importar": True,
        "edicion_exportar": True,
        "edicion_eliminar": True,
    },
    "director": {
        "elaborar": False,
        "verificar": False,
        "aprobar": True,
        "ver_todo": True,
        "admin_sistema": False,
        "edicion_ver": True,
        "edicion_crear": False,
        "edicion_editar": False,
        "edicion_importar": False,
        "edicion_exportar": True,
        "edicion_eliminar": False,
    },
    "responsable": {
        "elaborar": True,
        "verificar": False,
        "aprobar": False,
        "ver_todo": False,
        "admin_sistema": False,
        "edicion_ver": True,
        "edicion_crear": True,
        "edicion_editar": True,
        "edicion_importar": True,
        "edicion_exportar": True,
        "edicion_eliminar": False,
    },
    "verificador": {
        "elaborar": False,
        "verificar": True,
        "aprobar": False,
        "ver_todo": False,
        "admin_sistema": False,
        "edicion_ver": True,
        "edicion_crear": False,
        "edicion_editar": False,
        "edicion_importar": False,
        "edicion_exportar": True,
        "edicion_eliminar": False,
    },
    "elaborador": {
        "elaborar": True,
        "verificar": False,
        "aprobar": False,
        "ver_todo": False,
        "admin_sistema": False,
        "edicion_ver": True,
        "edicion_crear": True,
        "edicion_editar": True,
        "edicion_importar": True,
        "edicion_exportar": False,
        "edicion_eliminar": False,
    },
    "consultor": {
        "elaborar": False,
        "verificar": False,
        "aprobar": False,
        "ver_todo": False,
        "admin_sistema": False,
        "edicion_ver": True,
        "edicion_crear": False,
        "edicion_editar": False,
        "edicion_importar": False,
        "edicion_exportar": False,
        "edicion_eliminar": False,
    },
}


def tiene_permiso(rol: str, permiso: str) -> bool:
    if rol not in ROLES_PRODUCCION:
        return False
    return ROLES_PRODUCCION[rol].get(permiso, False)
