"use client"
import { useState, useMemo } from "react"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Pagination } from "@/components/ui/pagination"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Usuario } from "@/types/usuario"
import { formatDate } from "@/lib/utils"

export default function UsuariosPage() {
  const [search, setSearch] = useState("")
  const params = useMemo(() => ({
    search: search || undefined,
  }), [search])

  const { items: usuarios, total, limit, offset, loading, setPage } = usePaginatedQuery<Usuario>("/usuarios", { params })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Usuarios</h1>
        <p className="text-sm text-muted mt-1">{total} usuario{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted font-medium p-3">Nombre</th>
                <th className="text-left text-xs text-muted font-medium p-3">Email</th>
                <th className="text-left text-xs text-muted font-medium p-3">Rol</th>
                <th className="text-left text-xs text-muted font-medium p-3">Estado</th>
                <th className="text-left text-xs text-muted font-medium p-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-6 text-muted">Cargando...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-6 text-muted">Sin usuarios</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface/30">
                    <td className="p-3 text-sm text-text">{u.nombre}</td>
                    <td className="p-3 text-sm text-muted">{u.email}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-3"><BadgeEstado estado={u.activo ? "activo" : "inactivo"} /></td>
                    <td className="p-3 text-sm text-muted">{formatDate(u.created_at)}</td>
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
