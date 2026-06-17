export interface Documento {
  id: string
  codigo: string
  titulo: string
  tipo: string
  iso_norma: string[]
  estado: string
  version_actual: number
  elaborador_id?: string
  revisor_id?: string
  aprobador_id?: string
  fecha_elaboracion?: string
  fecha_revision?: string
  fecha_aprobacion?: string
  fecha_vigencia?: string
  fecha_obsoleto?: string
  motivo_rechazo?: string
  acceso_roles?: string[]
  created_at: string
  updated_at: string
}

export interface VersionDocumento {
  id: string
  numero_version: number
  contenido_html: string
  contenido_pdf_url?: string
  motivo_cambio?: string
  estado: string
  created_at: string
}

export interface DocumentoDetail extends Documento {
  versiones: VersionDocumento[]
}

export interface DocumentoCreate {
  codigo: string
  titulo: string
  tipo: string
  iso_norma?: string[]
  contenido_html?: string
  elaborado_por?: string
  acceso_roles?: string[]
}

export interface WorkflowState {
  documento_id: string
  estado: string
  elaborador_id?: string
  elaborador_nombre?: string
  revisor_id?: string
  revisor_nombre?: string
  aprobador_id?: string
  aprobador_nombre?: string
  fecha_elaboracion?: string
  fecha_revision?: string
  fecha_aprobacion?: string
  motivo_rechazo?: string
  acciones_disponibles: string[]
}

export interface HistorialEntry {
  id: string
  usuario_id: string
  usuario_nombre: string
  accion: string
  estado_anterior?: string
  estado_nuevo?: string
  comentario?: string
  version_numero?: string
  created_at: string
}
