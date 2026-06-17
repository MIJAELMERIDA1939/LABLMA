export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  telefono?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface UsuarioCreate {
  nombre: string
  email: string
  password: string
  rol: string
  telefono?: string
}
