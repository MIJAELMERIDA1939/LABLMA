"use client"
import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje?: string
  leida: boolean
  created_at: string
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await api.get("/notificaciones", { params: { leida: false } })
      setNotificaciones(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  const marcarLeida = async (id: string) => {
    await api.post(`/notificaciones/${id}/leer`)
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }

  const marcarTodasLeidas = async () => {
    await api.post("/notificaciones/leer-todas")
    setNotificaciones([])
  }

  return { notificaciones, loading, marcarLeida, marcarTodasLeidas, refetch: fetch }
}
