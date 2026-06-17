"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import api from "@/lib/api"

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

interface UsePaginatedQueryOptions {
  limit?: number
  initialOffset?: number
  params?: Record<string, string | undefined>
}

export function usePaginatedQuery<T>(endpoint: string, options: UsePaginatedQueryOptions = {}) {
  const { limit = 15, initialOffset = 0, params = {} } = options
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(initialOffset)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const prevParamsRef = useRef<string>("")

  const fetch = useCallback(async (off: number, p: Record<string, string | undefined>) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const queryParams: Record<string, string> = { limit: String(limit), offset: String(off) }
      for (const [key, value] of Object.entries(p)) {
        if (value) queryParams[key] = value
      }
      const res = await api.get<PaginatedResponse<T>>(endpoint, {
        params: queryParams,
        signal: abortRef.current.signal,
      })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      if (err?.name !== "CanceledError") {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, limit])

  const paramsKey = JSON.stringify(params)
  useEffect(() => {
    if (prevParamsRef.current !== paramsKey) {
      prevParamsRef.current = paramsKey
      setOffset(0)
      fetch(0, params)
    } else {
      fetch(offset, params)
    }
    return () => abortRef.current?.abort()
  }, [fetch, paramsKey, offset, params])

  const setPage = useCallback((newOffset: number) => {
    setOffset(newOffset)
  }, [])

  return { items, total, limit, offset, loading, setPage }
}
