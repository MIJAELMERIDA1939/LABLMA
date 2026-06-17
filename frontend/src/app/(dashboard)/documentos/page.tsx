"use client"
import { useState } from "react"
import { useDocumentos } from "@/hooks/useDocumentos"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { ListaMaestra } from "@/components/documentos/ListaMaestra"
import { VistaTarjetas } from "@/components/documentos/VistaTarjetas"
import { Plus, Search, FileText, Clock, CheckCircle, Archive, Table, Grid3X3 } from "lucide-react"
import Link from "next/link"

import { TIPOS_DOCUMENTO, ESTADOS_DOCUMENTO } from "@/lib/constants"

const RESUMEN_ESTADOS: { key: string; label: string; icon: any; color: string }[] = [
  { key: "borrador", label: "Borradores", icon: FileText, color: "text-gray-400" },
  { key: "en_revision", label: "En Revisión", icon: Clock, color: "text-yellow-400" },
  { key: "vigente", label: "Vigentes", icon: CheckCircle, color: "text-green-400" },
  { key: "obsoleto", label: "Obsoletos", icon: Archive, color: "text-red-400" },
]

export default function DocumentosPage() {
  const { documentos, total, loading, filters, setFilter, setSearch, limit, offset, setOffset } = useDocumentos()
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Lista Maestra de Documentos</h1>
          <p className="text-sm text-muted mt-1">{total} documento{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
            className="text-muted"
          >
            {viewMode === "table" ? <Grid3X3 className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </Button>
          <Link href="/documentos/nuevo">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Documento
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Buscar por código o título..."
            className="pl-10"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={TIPOS_DOCUMENTO}
          value={filters.tipo || ""}
          onChange={(e) => setFilter("tipo", e.target.value)}
          className="sm:w-44"
        />
        <Select
          options={ESTADOS_DOCUMENTO}
          value={filters.estado || ""}
          onChange={(e) => setFilter("estado", e.target.value)}
          className="sm:w-44"
        />
      </div>

      {viewMode === "table" ? (
        <ListaMaestra documentos={documentos} loading={loading} />
      ) : (
        <VistaTarjetas documentos={documentos} loading={loading} />
      )}

      <Pagination total={total} limit={limit} offset={offset} onChange={setOffset} />
    </div>
  )
}
