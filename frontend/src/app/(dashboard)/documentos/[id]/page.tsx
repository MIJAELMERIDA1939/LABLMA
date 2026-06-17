"use client"
import { useParams, useRouter } from "next/navigation"
import { useDocumento } from "@/hooks/useDocumentos"
import { useWorkflow } from "@/hooks/useWorkflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { FlujoAprobacion } from "@/components/documentos/FlujoAprobacion"
import { VersionHistory } from "@/components/documentos/VersionHistory"
import { EditorConAutoSave } from "@/components/documentos/EditorConAutoSave"
import { PanelWorkflow } from "@/components/documentos/PanelWorkflow"
import { TimelineHistorial } from "@/components/documentos/TimelineHistorial"
import { formatDate, extractErrorMessage } from "@/lib/utils"
import { ArrowLeft, FileText, Info, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NORMAS_ISO, getTipoConfig } from "@/lib/constants"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"
import { useState } from "react"

export default function DocumentoDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { doc, loading, refetch } = useDocumento(id as string)
  const { workflow, historial, loading: wfLoading, enviarRevision, aprobar, rechazar, darDeBaja, refetch: refetchWorkflow } = useWorkflow(id as string)
  const [showEditor, setShowEditor] = useState(false)

  const handleWorkflowAction = async (fn: () => Promise<void>) => {
    await fn()
    refetch()
    refetchWorkflow()
  }

  if (loading || wfLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-border/50 animate-pulse" />
          <div className="h-8 w-64 rounded bg-border/50 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6"><div className="h-64 rounded bg-border/50 animate-pulse" /></CardContent></Card>
          </div>
          <div className="space-y-4">
            <Card><CardContent className="p-6"><div className="h-32 rounded bg-border/50 animate-pulse" /></CardContent></Card>
          </div>
        </div>
      </div>
    )
  }

  if (!doc) return (
    <div className="text-center py-20">
      <p className="text-muted text-lg">Documento no encontrado</p>
      <Link href="/documentos"><Button variant="outline" className="mt-4">Volver a documentos</Button></Link>
    </div>
  )

  const tipoConfig = getTipoConfig(doc.tipo)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/documentos">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">{doc.titulo}</h1>
        <BadgeEstado estado={doc.estado} />
        <span className="text-sm font-mono text-primary">{doc.codigo}</span>
      </div>

      <FlujoAprobacion estadoActual={doc.estado} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contenido del Documento</CardTitle>
                {doc.estado === "borrador" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditor(!showEditor)}
                  >
                    {showEditor ? "Ocultar Editor" : "Editar"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showEditor && doc.estado === "borrador" ? (
                <EditorConAutoSave
                  documentoId={doc.id}
                  contenidoInicial={doc.versiones[0]?.contenido_html || ""}
                  tituloInicial={doc.titulo}
                  estado={doc.estado}
                />
              ) : doc.versiones[0]?.contenido_html ? (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: doc.versiones[0].contenido_html }}
                />
              ) : (
                <div className="text-center py-8 text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Sin contenido</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial */}
          <TimelineHistorial historial={historial} />

          {/* Versiones */}
          <Card>
            <CardHeader>
              <CardTitle>Versiones</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistory versiones={doc.versiones} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Workflow Panel */}
          {workflow ? (
            <PanelWorkflow
              workflow={workflow}
              onEnviarRevision={(c) => handleWorkflowAction(() => enviarRevision(c))}
              onAprobar={(c) => handleWorkflowAction(() => aprobar(c))}
              onRechazar={(m, c) => handleWorkflowAction(() => rechazar(m, c))}
              onDarDeBaja={() => handleWorkflowAction(() => darDeBaja())}
            />
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="h-20 rounded bg-border/50 animate-pulse" />
              </CardContent>
            </Card>
          )}

          {/* Info del documento */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted">Código</p>
                <p className="text-sm font-mono text-primary">{doc.codigo}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Tipo</p>
                <p className="text-sm">{tipoConfig?.label || doc.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Versión Actual</p>
                <p className="text-sm">v{doc.version_actual}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Fecha Elaboración</p>
                <p className="text-sm">{formatDate(doc.fecha_elaboracion)}</p>
              </div>
              {doc.fecha_vigencia && (
                <div>
                  <p className="text-xs text-muted">Fecha Vigencia</p>
                  <p className="text-sm">{formatDate(doc.fecha_vigencia)}</p>
                </div>
              )}
              {doc.iso_norma && doc.iso_norma.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1.5">Normas ISO</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.iso_norma.map((norma) => {
                      const normaInfo = NORMAS_ISO.find((n) => n.value === norma)
                      return (
                        <Badge key={norma} estado="vigente" className="text-[10px]">
                          {normaInfo?.label?.split(" - ")[0] || norma}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Link href={`/documentos/${doc.id}/contenido`} className="w-full">
            <Button className="w-full" variant="default">
              <BookOpen className="w-4 h-4 mr-2" /> Ver Contenido
            </Button>
          </Link>

          <Button className="w-full" variant="outline" onClick={() => window.open(`/api/v1/documentos/${doc.id}/pdf`, "_blank")}>
            <FileText className="w-4 h-4 mr-2" /> Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
