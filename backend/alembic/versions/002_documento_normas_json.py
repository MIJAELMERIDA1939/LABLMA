"""documento normas json

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("documentos", "tipo", existing_type=sa.String(20), type_=sa.String(50))
    op.alter_column("documentos", "iso_norma", existing_type=sa.String(20), type_=sa.Text(), nullable=True)
    op.execute("UPDATE documentos SET iso_norma = '[]' WHERE iso_norma IS NULL")


def downgrade() -> None:
    op.alter_column("documentos", "iso_norma", existing_type=sa.Text(), type_=sa.String(20))
    op.alter_column("documentos", "tipo", existing_type=sa.String(50), type_=sa.String(20))
