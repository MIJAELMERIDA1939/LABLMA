"""initial_schema

Revision ID: 001
Revises:
Create Date: 2024-06-11
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "documentos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("titulo", sa.String(255), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("iso_norma", sa.String(20), nullable=False),
        sa.Column("estado", sa.String(20), server_default="borrador"),
        sa.Column("version_actual", sa.Integer(), server_default=sa.text("1")),
        sa.Column("elaborado_por", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("verificado_por", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("aprobado_por", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("fecha_elaboracion", sa.Date(), nullable=True),
        sa.Column("fecha_vigencia", sa.Date(), nullable=True),
        sa.Column("fecha_obsoleto", sa.Date(), nullable=True),
        sa.Column("acceso_roles", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "versiones_documento",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("documento_id", sa.String(36), sa.ForeignKey("documentos.id"), nullable=False),
        sa.Column("numero_version", sa.Integer(), nullable=False),
        sa.Column("contenido_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("contenido_pdf_url", sa.String(500), nullable=True),
        sa.Column("motivo_cambio", sa.Text(), nullable=True),
        sa.Column("autor_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("estado", sa.String(20), server_default="borrador"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "no_conformidades",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("fuente", sa.String(100), nullable=True),
        sa.Column("fecha_deteccion", sa.Date(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("evidencia_url", sa.String(500), nullable=True),
        sa.Column("area_afectada", sa.String(100), nullable=True),
        sa.Column("clasificacion", sa.String(20), nullable=False),
        sa.Column("responsable_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("aprobador_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("verificador_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("estado", sa.String(20), server_default="abierta"),
        sa.Column("fecha_limite", sa.Date(), nullable=False),
        sa.Column("fecha_cierre", sa.Date(), nullable=True),
        sa.Column("eficaz", sa.Boolean(), nullable=True),
        sa.Column("analisis_causa", sa.Text(), nullable=True),
        sa.Column("correccion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "planes_accion",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nc_id", sa.String(36), sa.ForeignKey("no_conformidades.id"), nullable=False),
        sa.Column("actividad", sa.Text(), nullable=False),
        sa.Column("responsable_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("fecha_inicio", sa.Date(), nullable=True),
        sa.Column("fecha_fin", sa.Date(), nullable=True),
        sa.Column("estado", sa.String(20), server_default="pendiente"),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "riesgos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("proceso", sa.String(100), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("probabilidad", sa.Integer(), nullable=False),
        sa.Column("impacto", sa.Integer(), nullable=False),
        sa.Column("tipo_tratamiento", sa.String(20), nullable=True),
        sa.Column("accion", sa.Text(), nullable=True),
        sa.Column("responsable_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("fecha_revision", sa.Date(), nullable=True),
        sa.Column("estado", sa.String(20), server_default="activo"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "planes_programas",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("titulo", sa.String(255), nullable=False),
        sa.Column("iso_norma", sa.String(20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("estado", sa.String(20), server_default="borrador"),
        sa.Column("elaborado_por", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("aprobado_por", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "tareas_plan",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("plan_id", sa.String(36), sa.ForeignKey("planes_programas.id"), nullable=False),
        sa.Column("nombre", sa.String(255), nullable=False),
        sa.Column("responsable_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("progreso", sa.Integer(), server_default=sa.text("0")),
        sa.Column("estado", sa.String(20), server_default="pendiente"),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "notificaciones",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("usuario_id", sa.String(36), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("tipo", sa.String(30), nullable=False),
        sa.Column("titulo", sa.String(255), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=True),
        sa.Column("leida", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("referencia_tipo", sa.String(50), nullable=True),
        sa.Column("referencia_id", sa.String(36), nullable=True),
        sa.Column("canal_enviado", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notificaciones")
    op.drop_table("tareas_plan")
    op.drop_table("planes_programas")
    op.drop_table("riesgos")
    op.drop_table("planes_accion")
    op.drop_table("no_conformidades")
    op.drop_table("versiones_documento")
    op.drop_table("documentos")
    op.drop_table("usuarios")
