"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import api from "@/lib/api"
import { Documento, DocumentoDetail, DocumentoCreate } from "@/types/documento"

export interface DocumentoFilters {
  search?: string
  tipo?: string
  estado?: string
  iso_norma?: string
}

interface PaginatedResult {
  items: Documento[]
  total: number
  limit: number
  offset: number
}

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DocumentoFilters>({})
  const [limit] = useState(15)
  const [offset, setOffset] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetch = useCallback(async (f: DocumentoFilters, lim: number, off: number) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { limit: String(lim), offset: String(off) }
      if (f.search) params.search = f.search
      if (f.tipo) params.tipo = f.tipo
      if (f.estado) params.estado = f.estado
      if (f.iso_norma) params.iso_norma = f.iso_norma
      const res = await api.get<PaginatedResult>("/documentos", { params })
      setDocumentos(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch(filters, limit, offset)
  }, [fetch, filters, limit, offset])

  const setFilter = useCallback((key: keyof DocumentoFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
    setOffset(0)
  }, [])

  const setSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilter("search", value)
    }, 300)
  }, [setFilter])

  return {
    documentos,
    total,
    loading,
    filters,
    limit,
    offset,
    setFilter,
    setSearch,
    setOffset,
    refetch: () => fetch(filters, limit, offset),
  }
}

export function useDocumento(id: string) {
  const [doc, setDoc] = useState<DocumentoDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    if (!id) return
    setLoading(true)
    api.get(`/documentos/${id}`)
      .then((res) => setDoc(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { doc, loading, refetch: fetch }
}

export async function createDocumento(data: DocumentoCreate) {
  const res = await api.post("/documentos", data)
  return res.data
}
