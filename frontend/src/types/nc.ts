export interface PlanAccion {
  id: string
  nc_id: string
  actividad: string
  responsable_id?: string
  fecha_inicio?: string
  fecha_fin?: string
  estado: string
  observaciones?: string
}

export interface NoConformidad {
  id: string
  codigo: string
  tipo: string
  fuente?: string
  fecha_deteccion: string
  descripcion: string
  evidencia_url?: string
  area_afectada?: string
  clasificacion: string
  responsable_id?: string
  aprobador_id?: string
  verificador_id?: string
  estado: string
  fecha_limite: string
  fecha_cierre?: string
  eficaz?: boolean
  analisis_causa?: string
  correccion?: string
  created_at: string
  updated_at: string
  planes_accion: PlanAccion[]
}
