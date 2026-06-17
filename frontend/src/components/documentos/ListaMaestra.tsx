"use client"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Documento } from "@/types/documento"
import { formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

interface ListaMaestraProps {
  documentos: Documento[]
  loading?: boolean
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      <td className="p-3"><div className="h-4 w-20 rounded bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-4 w-48 rounded bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-4 w-24 rounded bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-4 w-8 rounded bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-5 w-20 rounded-full bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-4 w-24 rounded bg-border/50 animate-pulse" /></td>
      <td className="p-3"><div className="h-4 w-10 rounded bg-border/50 animate-pulse" /></td>
    </tr>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="p-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <FileText className="w-12 h-12 text-muted/40" />
          <p className="text-muted">No hay documentos registrados</p>
          <Link href="/documentos/nuevo">
            <Button variant="outline" size="sm">Crear primer documento</Button>
          </Link>
        </div>
      </td>
    </tr>
  )
}

export function ListaMaestra({ documentos, loading }: ListaMaestraProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted font-medium p-3">Código</th>
              <th className="text-left text-xs text-muted font-medium p-3">Título</th>
              <th className="text-left text-xs text-muted font-medium p-3">Tipo</th>
              <th className="text-left text-xs text-muted font-medium p-3">Versión</th>
              <th className="text-left text-xs text-muted font-medium p-3">Estado</th>
              <th className="text-left text-xs text-muted font-medium p-3">Vigencia</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : documentos.length === 0 ? (
              <EmptyState />
            ) : (
              documentos.map((doc) => (
                <tr key={doc.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                  <td className="p-3 text-sm font-mono text-primary">{doc.codigo}</td>
                  <td className="p-3 text-sm text-text">{doc.titulo}</td>
                  <td className="p-3 text-sm text-muted capitalize">{doc.tipo}</td>
                  <td className="p-3 text-sm text-muted">v{doc.version_actual}</td>
                  <td className="p-3"><BadgeEstado estado={doc.estado} /></td>
                  <td className="p-3 text-sm text-muted">{formatDate(doc.fecha_vigencia)}</td>
                  <td className="p-3">
                    <Link href={`/documentos/${doc.id}`}><Button variant="ghost" size="sm">Ver</Button></Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
