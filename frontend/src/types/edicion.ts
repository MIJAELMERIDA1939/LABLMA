export interface DocumentoEdicion {
  id: string
  titulo: string
  creado_por: string
  creado_por_id: string
  created_at: string
  updated_at: string
  formato: string
  tamano: number
  contenido_html?: string
}
