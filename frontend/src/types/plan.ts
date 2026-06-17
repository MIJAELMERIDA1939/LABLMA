export interface TareaPlan {
  id: string
  plan_id: string
  nombre: string
  responsable_id?: string
  fecha_inicio: string
  fecha_fin: string
  progreso: number
  estado: string
  observaciones?: string
}

export interface PlanPrograma {
  id: string
  titulo: string
  iso_norma?: string
  ano: number
  estado: string
  elaborado_por?: string
  aprobado_por?: string
  created_at: string
  updated_at: string
  tareas: TareaPlan[]
}
