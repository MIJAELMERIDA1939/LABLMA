"use client"
import { useState, useMemo } from "react"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { NoConformidad } from "@/types/nc"

const ESTADOS_FILTER = [
  { value: "", label: "Todos los estados" },
  { value: "abierta", label: "Abiertas" },
  { value: "en_analisis", label: "En Análisis" },
  { value: "plan_aprobado", label: "Plan Aprobado" },
  { value: "en_ejecucion", label: "En Ejecución" },
  { value: "cerrada", label: "Cerradas" },
  { value: "vencida", label: "Vencidas" },
]

export default function NoConformidadesPage() {
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const params = useMemo(() => ({
    estado: filtroEstado || undefined,
    search: search || undefined,
  }), [filtroEstado, search])

  const { items: ncs, total, limit, offset, loading, setPage } = usePaginatedQuery<NoConformidad>("/nc", { params })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">No Conformidades</h1>
          <p className="text-sm text-muted mt-1">{total} registro{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/no-conformidades/nueva">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Registrar NC
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Buscar por código o descripción..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={ESTADOS_FILTER}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-48"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted font-medium p-3">Código</th>
                <th className="text-left text-xs text-muted font-medium p-3">Tipo</th>
                <th className="text-left text-xs text-muted font-medium p-3">Descripción</th>
                <th className="text-left text-xs text-muted font-medium p-3">Clasificación</th>
                <th className="text-left text-xs text-muted font-medium p-3">Estado</th>
                <th className="text-left text-xs text-muted font-medium p-3">Fecha Límite</th>
                <th className="text-left text-xs text-muted font-medium p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-muted">Cargando...</td></tr>
              ) : ncs.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-muted">Sin no conformidades</td></tr>
              ) : (
                ncs.map((nc) => (
                  <tr key={nc.id} className="border-b border-border/50 hover:bg-surface/30">
                    <td className="p-3 text-sm font-mono text-primary">{nc.codigo}</td>
                    <td className="p-3 text-sm text-muted">{nc.tipo}</td>
                    <td className="p-3 text-sm text-text max-w-xs truncate">{nc.descripcion}</td>
                    <td className="p-3 text-sm text-muted">{nc.clasificacion}</td>
                    <td className="p-3"><BadgeEstado estado={nc.estado} /></td>
                    <td className="p-3 text-sm text-muted">{formatDate(nc.fecha_limite)}</td>
                    <td className="p-3">
                      <Link href={`/no-conformidades/${nc.id}`}>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Pagination total={total} limit={limit} offset={offset} onChange={setPage} />
    </div>
  )
}
