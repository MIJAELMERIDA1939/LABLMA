export interface Riesgo {
  id: string
  codigo: string
  proceso?: string
  descripcion: string
  probabilidad: number
  impacto: number
  nivel_riesgo?: number
  tipo_tratamiento?: string
  accion?: string
  responsable_id?: string
  fecha_revision?: string
  estado: string
  created_at: string
  updated_at: string
}

export interface RiesgoMatriz {
  id: string
  codigo: string
  proceso?: string
  probabilidad: number
  impacto: number
  nivel_riesgo: number
  estado: string
  descripcion: string
  tipo_tratamiento?: string
}
