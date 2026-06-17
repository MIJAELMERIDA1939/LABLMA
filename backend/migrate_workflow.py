"""
migrate_workflow.py
Migración: Agrega tablas y columnas para el sistema de workflow.
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sgc.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Crear tabla historial_documento
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='historial_documento'")
if not c.fetchone():
    c.execute('''CREATE TABLE historial_documento (
        id TEXT PRIMARY KEY,
        documento_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        accion TEXT NOT NULL,
        estado_anterior TEXT,
        estado_nuevo TEXT,
        comentario TEXT,
        version_numero TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (documento_id) REFERENCES documentos(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )''')
    print('Tabla historial_documento creada')

# Agregar columnas a documentos
c.execute('PRAGMA table_info(documentos)')
cols = [col[1] for col in c.fetchall()]

new_cols = {
    'elaborador_id': 'TEXT',
    'revisor_id': 'TEXT',
    'aprobador_id': 'TEXT',
    'fecha_revision': 'DATETIME',
    'fecha_aprobacion': 'DATETIME',
    'motivo_rechazo': 'TEXT',
}

for col_name, col_type in new_cols.items():
    if col_name not in cols:
        c.execute(f'ALTER TABLE documentos ADD COLUMN {col_name} {col_type}')
        print(f'Columna {col_name} agregada')

# Migrar datos existentes
c.execute('UPDATE documentos SET elaborador_id = elaborado_por WHERE elaborador_id IS NULL AND elaborado_por IS NOT NULL')

conn.commit()
conn.close()
print('Migración completada exitosamente')
