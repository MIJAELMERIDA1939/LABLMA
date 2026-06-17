import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt: string = "dd/MM/yyyy"): string {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function extractErrorMessage(error: any, fallback = "Error inesperado"): string {
  if (!error?.response?.data?.detail) {
    if (typeof error?.message === "string") return error.message
    return fallback
  }
  const detail = error.response.data.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail.map((e: any) => e?.msg || JSON.stringify(e)).join("; ")
  }
  return fallback
}

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    vigente: "text-green-400 bg-green-400/10",
    aprobado: "text-green-400 bg-green-400/10",
    borrador: "text-gray-400 bg-gray-400/10",
    en_revision: "text-yellow-400 bg-yellow-400/10",
    obsoleto: "text-red-400 bg-red-400/10",
    abierta: "text-yellow-400 bg-yellow-400/10",
    en_analisis: "text-blue-400 bg-blue-400/10",
    plan_aprobado: "text-green-400 bg-green-400/10",
    en_ejecucion: "text-blue-400 bg-blue-400/10",
    cerrada: "text-green-400 bg-green-400/10",
    vencida: "text-red-400 bg-red-400/10",
    activo: "text-yellow-400 bg-yellow-400/10",
    en_tratamiento: "text-blue-400 bg-blue-400/10",
    cerrado: "text-green-400 bg-green-400/10",
    pendiente: "text-gray-400 bg-gray-400/10",
    en_curso: "text-blue-400 bg-blue-400/10",
    completada: "text-green-400 bg-green-400/10",
  }
  return colors[estado] || "text-gray-400 bg-gray-400/10"
}
