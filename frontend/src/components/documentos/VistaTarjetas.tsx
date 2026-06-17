"use client"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Documento } from "@/types/documento"
import { formatDate } from "@/lib/utils"
import { FileText, Eye } from "lucide-react"

interface VistaTarjetasProps {
  documentos: Documento[]
  loading?: boolean
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="h-4 w-24 rounded bg-border/50" />
        <div className="h-5 w-full rounded bg-border/50" />
        <div className="flex justify-between">
          <div className="h-4 w-16 rounded bg-border/50" />
          <div className="h-5 w-20 rounded-full bg-border/50" />
        </div>
      </CardContent>
    </Card>
  )
}

export function VistaTarjetas({ documentos, loading }: VistaTarjetasProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <FileText className="w-12 h-12 text-muted/40" />
        <p className="text-muted">No hay documentos registrados</p>
        <Link href="/documentos/nuevo">
          <Button variant="outline" size="sm">Crear primer documento</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documentos.map((doc) => (
        <Link key={doc.id} href={`/documentos/${doc.id}`} className="block group">
          <Card className="h-full transition-all hover:ring-2 hover:ring-primary/50 hover:border-primary/30">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-primary">{doc.codigo}</span>
                <BadgeEstado estado={doc.estado} />
              </div>
              <h3 className="text-sm font-medium text-text line-clamp-2 mb-2 flex-1">{doc.titulo}</h3>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="capitalize">{doc.tipo}</span>
                  <span>v{doc.version_actual}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Eye className="w-3 h-3" />
                  <span>{formatDate(doc.fecha_vigencia)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
