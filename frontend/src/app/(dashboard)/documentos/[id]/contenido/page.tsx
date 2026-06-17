"use client"
import { useParams, useRouter } from "next/navigation"
import { useDocumento } from "@/hooks/useDocumentos"
import { DocumentContentViewer } from "@/components/documentos/DocumentContentViewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"

export default function DocumentoContenidoPage() {
  const { id } = useParams()
  const router = useRouter()
  const { doc, loading } = useDocumento(id as string)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-border/50 animate-pulse" />
          <div className="h-8 w-64 rounded bg-border/50 animate-pulse" />
        </div>
        <div className="h-[600px] rounded-lg bg-border/30 animate-pulse" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-muted text-lg">Documento no encontrado</p>
        <Link href="/documentos">
          <Button variant="outline" className="mt-4">Volver a documentos</Button>
        </Link>
      </div>
    )
  }

  const contenido = doc.versiones?.[0]?.contenido_html || ""

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/documentos/${doc.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {doc.titulo}
            </h1>
            <p className="text-xs text-muted font-mono">{doc.codigo} — v{doc.version_actual}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/api/v1/documentos/${doc.id}/pdf`, "_blank")}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {contenido ? (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <DocumentContentViewer
            contenidoHtml={contenido}
            codigo={doc.codigo}
            titulo={doc.titulo}
            version={doc.version_actual}
            fechaElaboracion={doc.fecha_elaboracion}
            fechaVigencia={doc.fecha_vigencia}
          />
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-border">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-gray-500 text-lg">Este documento no tiene contenido registrado</p>
          <p className="text-gray-400 text-sm mt-1">Edite el documento para agregar contenido</p>
        </div>
      )}
    </div>
  )
}
