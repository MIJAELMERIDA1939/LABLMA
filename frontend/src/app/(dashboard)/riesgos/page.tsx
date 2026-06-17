"use client"
import { useState, useMemo } from "react"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Pagination } from "@/components/ui/pagination"
import { Riesgo } from "@/types/riesgo"

export default function RiesgosPage() {
  const [search, setSearch] = useState("")
  const params = useMemo(() => ({
    search: search || undefined,
  }), [search])

  const { items: riesgos, total, limit, offset, loading, setPage } = usePaginatedQuery<Riesgo>("/riesgos", { params })

  const getHeatColor = (nivel: number) => {
    if (nivel >= 15) return "bg-red-500/20 text-red-400"
    if (nivel >= 8) return "bg-orange-500/20 text-orange-400"
    if (nivel >= 4) return "bg-yellow-500/20 text-yellow-400"
    return "bg-green-500/20 text-green-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Matriz de Riesgos</h1>
          <p className="text-sm text-muted mt-1">{total} registro{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mapa de Calor de Riesgos</CardTitle>
            <input
              type="text"
              placeholder="Buscar riesgo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md bg-background border border-border text-text placeholder:text-muted"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-1 max-w-sm mb-6">
            {[5,4,3,2,1].map(prob => (
              [1,2,3,4,5].map(imp => {
                const nivel = prob * imp
                return (
                  <div key={`${prob}-${imp}`} className={`text-center p-2 text-xs rounded ${getHeatColor(nivel)}`}>
                    {nivel}
                  </div>
                )
              })
            ))}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted p-3">Código</th>
                <th className="text-left text-xs text-muted p-3">Proceso</th>
                <th className="text-left text-xs text-muted p-3">Descripción</th>
                <th className="text-center text-xs text-muted p-3">Prob</th>
                <th className="text-center text-xs text-muted p-3">Imp</th>
                <th className="text-center text-xs text-muted p-3">Nivel</th>
                <th className="text-left text-xs text-muted p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-muted">Cargando...</td></tr>
              ) : riesgos.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-muted">Sin riesgos registrados</td></tr>
              ) : (
                riesgos.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-surface/30">
                    <td className="p-3 text-sm font-mono text-primary">{r.codigo}</td>
                    <td className="p-3 text-sm text-muted">{r.proceso || "—"}</td>
                    <td className="p-3 text-sm text-text max-w-xs truncate">{r.descripcion}</td>
                    <td className="p-3 text-sm text-center">{r.probabilidad}</td>
                    <td className="p-3 text-sm text-center">{r.impacto}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getHeatColor(r.probabilidad * r.impacto)}`}>
                        {r.probabilidad * r.impacto}
                      </span>
                    </td>
                    <td className="p-3"><BadgeEstado estado={r.estado} /></td>
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
