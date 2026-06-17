"use client"
import { useState, useMemo } from "react"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Pagination } from "@/components/ui/pagination"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PlanPrograma } from "@/types/plan"
import { formatDate } from "@/lib/utils"

export default function PlanesPage() {
  const [search, setSearch] = useState("")
  const params = useMemo(() => ({
    search: search || undefined,
  }), [search])

  const { items: planes, total, limit, offset, loading, setPage } = usePaginatedQuery<PlanPrograma>("/planes", { params })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Planes y Programas</h1>
        <p className="text-sm text-muted mt-1">{total} registro{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Buscar por título..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : planes.length === 0 ? (
          <p className="text-muted">Sin planes registrados</p>
        ) : (
          planes.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{plan.titulo}</CardTitle>
                    <p className="text-sm text-muted mt-1">{plan.ano}</p>
                  </div>
                  <BadgeEstado estado={plan.estado} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.tareas.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                      <div className="flex-1">
                        <p className="text-sm text-text">{t.nombre}</p>
                        <p className="text-xs text-muted">{formatDate(t.fecha_inicio)} - {formatDate(t.fecha_fin)}</p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${t.progreso}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted w-10 text-right">{t.progreso}%</span>
                      <BadgeEstado estado={t.estado} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Pagination total={total} limit={limit} offset={offset} onChange={setPage} />
    </div>
  )
}
