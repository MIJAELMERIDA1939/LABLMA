import api from "./api"

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    nombre: string
    email: string
    rol: string
    activo: boolean
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post("/auth/login", { email, password })
  const data = res.data as LoginResponse
  localStorage.setItem("token", data.access_token)
  localStorage.setItem("user", JSON.stringify(data.user))
  return data
}

export async function getMe() {
  const res = await api.get("/auth/me")
  return res.data
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}

export function getUser() {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("user")
  return data ? JSON.parse(data) : null
}

export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}
