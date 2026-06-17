"""
seed.py
Responsabilidad: Script para poblar la BD con datos iniciales de demo.
Dependencias: database, models, auth/service
Exportaciones: seed_demo
"""

import asyncio
from uuid import uuid4
from app.database import async_session_maker
from app.models.usuario import Usuario
from app.models.documento import Documento
from app.models.version_documento import VersionDocumento
from app.models.no_conformidad import NoConformidad
from app.models.riesgo import Riesgo
from app.models.plan_programa import PlanPrograma
from app.models.tarea_plan import TareaPlan
from app.auth.service import hash_password
from datetime import date, timedelta
from app.sop_05_content import SOP_05_CONTENT


async def seed_demo():
    async with async_session_maker() as db:
        from sqlalchemy import select
        result = await db.execute(select(Usuario).where(Usuario.email == "admin@sgc.local"))
        existing = result.scalars().first()
        if existing:
            print("La BD ya tiene datos.")
            return

        admin_id = str(uuid4())
        director_id = str(uuid4())
        responsable_id = str(uuid4())
        verificador_id = str(uuid4())
        elaborador_id = str(uuid4())

        admin = Usuario(
            id=admin_id,
            nombre="Admin SGC",
            email="admin@sgc.local",
            password_hash=hash_password("Admin1234!"),
            rol="admin",
            telefono="+51999999999",
        )
        director = Usuario(
            id=director_id,
            nombre="Director Calidad",
            email="director@sgc.local",
            password_hash=hash_password("Director1234!"),
            rol="director",
        )
        responsable = Usuario(
            id=responsable_id,
            nombre="Responsable Lab",
            email="responsable@sgc.local",
            password_hash=hash_password("Resp1234!"),
            rol="responsable",
        )
        verificador = Usuario(
            id=verificador_id,
            nombre="Verificador Interno",
            email="verificador@sgc.local",
            password_hash=hash_password("Verif1234!"),
            rol="verificador",
        )
        elaborador = Usuario(
            id=elaborador_id,
            nombre="Elaborador Docs",
            email="elaborador@sgc.local",
            password_hash=hash_password("Elab1234!"),
            rol="elaborador",
        )

        db.add_all([admin, director, responsable, verificador, elaborador])
        await db.flush()

        # SOP-05 Atención al Cliente
        sop05 = Documento(
            codigo="SOP-05",
            titulo="Atención al Cliente",
            tipo="sop",
            iso_norma='["ISO_17025", "ISO_9001"]',
            estado="vigente",
            elaborador_id=elaborador.id,
            revisor_id=verificador.id,
            aprobador_id=director.id,
            fecha_elaboracion=date(2026, 2, 13),
            fecha_vigencia=date(2026, 2, 13),
            version_actual=8,
        )

        doc1 = Documento(
            codigo="PO-001",
            titulo="Procedimiento para Gestión de Documentos",
            tipo="procedimiento_operacion",
            iso_norma='["ISO_9001", "ISO_17025"]',
            estado="vigente",
            elaborador_id=elaborador.id,
            revisor_id=verificador.id,
            aprobador_id=director.id,
            fecha_vigencia=date.today(),
        )
        doc2 = Documento(
            codigo="IT-001",
            titulo="Instructivo para Calibración de Equipos",
            tipo="instruccion_trabajo",
            iso_norma='["ISO_17025"]',
            estado="borrador",
            elaborador_id=elaborador.id,
        )
        db.add_all([sop05, doc1, doc2])
        await db.flush()

        v_sop05 = VersionDocumento(
            documento_id=sop05.id,
            numero_version=8,
            contenido_html=SOP_05_CONTENT,
            autor_id=elaborador.id,
            estado="vigente",
        )
        v1 = VersionDocumento(
            documento_id=doc1.id,
            numero_version=1,
            contenido_html="<h1>Procedimiento para Gestión de Documentos</h1><p>Este procedimiento establece las directrices...</p>",
            autor_id=elaborador.id,
            estado="vigente",
        )
        db.add_all([v_sop05, v1])
        await db.flush()

        nc1 = NoConformidad(
            codigo="NC-2024-001",
            tipo="NC",
            fuente="Auditoría Interna 2024",
            fecha_deteccion=date.today() - timedelta(days=30),
            descripcion="Falta de calibración en balanza analítica del laboratorio de suelos",
            area_afectada="Laboratorio de Suelos",
            clasificacion="mayor",
            responsable_id=responsable.id,
            aprobador_id=director.id,
            verificador_id=verificador.id,
            estado="en_ejecucion",
            fecha_limite=date.today() + timedelta(days=15),
            analisis_causa="La balanza no fue incluida en el plan de calibración anual",
            correccion="Se contrató servicio de calibración externo",
        )
        nc2 = NoConformidad(
            codigo="NC-2024-002",
            tipo="TNC",
            fuente="Auditoría Externa INACAL",
            fecha_deteccion=date.today() - timedelta(days=5),
            descripcion="Tiempo de respuesta fuera del límite establecido en el procedimiento",
            area_afectada="Atención al Cliente",
            clasificacion="menor",
            responsable_id=responsable.id,
            estado="abierta",
            fecha_limite=date.today() + timedelta(days=45),
        )
        db.add_all([nc1, nc2])
        await db.flush()

        riesgo1 = Riesgo(
            codigo="RI-001",
            proceso="Gestión de Calibraciones",
            descripcion="Equipos sin calibración vigente pueden generar resultados no válidos",
            probabilidad=3,
            impacto=4,
            tipo_tratamiento="mitigar",
            accion="Implementar plan de calibración semestral con alertas automáticas",
            responsable_id=responsable.id,
            estado="activo",
        )
        db.add(riesgo1)
        await db.flush()

        plan1 = PlanPrograma(
            titulo="Programa de Auditorías Internas 2024",
            iso_norma="ISO_9001",
            ano=2024,
            estado="en_ejecucion",
            elaborado_por=elaborador.id,
            aprobado_por=director.id,
        )
        db.add(plan1)
        await db.flush()

        tarea1 = TareaPlan(
            plan_id=plan1.id,
            nombre="Auditar procedimiento PRO-001",
            responsable_id=verificador.id,
            fecha_inicio=date.today(),
            fecha_fin=date.today() + timedelta(days=30),
            progreso=0,
        )
        db.add(tarea1)
        await db.commit()

    print("Seed completado exitosamente.")
    print("Usuarios creados:")
    print("  admin@sgc.local / Admin1234!")
    print("  director@sgc.local / Director1234!")
    print("  responsable@sgc.local / Resp1234!")
    print("  verificador@sgc.local / Verif1234!")
    print("  elaborador@sgc.local / Elab1234!")
    print("  Documento SOP-05: Atención al Cliente (v08, vigente)")


if __name__ == "__main__":
    asyncio.run(seed_demo())
