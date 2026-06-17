"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import api from "@/lib/api"
import { WorkflowState, HistorialEntry } from "@/types/documento"

export function useWorkflow(documentoId: string) {
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null)
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkflow = useCallback(async () => {
    if (!documentoId) return
    try {
      const [wfRes, histRes] = await Promise.all([
        api.get(`/documentos/${documentoId}/workflow`),
        api.get(`/documentos/${documentoId}/historial`),
      ])
      setWorkflow(wfRes.data)
      setHistorial(histRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [documentoId])

  useEffect(() => { fetchWorkflow() }, [fetchWorkflow])

  const enviarRevision = async (comentario?: string) => {
    await api.post(`/documentos/${documentoId}/enviar-revision`, { comentario })
    await fetchWorkflow()
  }

  const aprobar = async (comentario?: string) => {
    await api.post(`/documentos/${documentoId}/aprobar`, { comentario })
    await fetchWorkflow()
  }

  const rechazar = async (motivo: string, comentario?: string) => {
    await api.post(`/documentos/${documentoId}/rechazar`, { motivo, comentario })
    await fetchWorkflow()
  }

  const darDeBaja = async () => {
    await api.post(`/documentos/${documentoId}/dar-de-baja`)
    await fetchWorkflow()
  }

  return {
    workflow,
    historial,
    loading,
    enviarRevision,
    aprobar,
    rechazar,
    darDeBaja,
    refetch: fetchWorkflow,
  }
}
