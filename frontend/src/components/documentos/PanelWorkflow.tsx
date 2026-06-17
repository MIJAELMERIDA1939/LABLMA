"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Send, CheckCircle, XCircle, Clock, User, Archive,
  ChevronDown, ChevronRight, AlertTriangle
} from "lucide-react"
import { WorkflowState } from "@/types/documento"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PanelWorkflowProps {
  workflow: WorkflowState
  onEnviarRevision: (comentario?: string) => Promise<void>
  onAprobar: (comentario?: string) => Promise<void>
  onRechazar: (motivo: string, comentario?: string) => Promise<void>
  onDarDeBaja: () => Promise<void>
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  borrador: { label: "Borrador", color: "text-gray-400 bg-gray-400/10", icon: Clock },
  en_revision: { label: "En Revisión", color: "text-yellow-400 bg-yellow-400/10", icon: Send },
  en_aprobacion: { label: "En Aprobación", color: "text-blue-400 bg-blue-400/10", icon: CheckCircle },
  vigente: { label: "Vigente", color: "text-green-400 bg-green-400/10", icon: CheckCircle },
  obsoleto: { label: "Obsoleto", color: "text-red-400 bg-red-400/10", icon: Archive },
}

const STEPS = [
  { key: "borrador", label: "Borrador" },
  { key: "en_revision", label: "Revisión" },
  { key: "en_aprobacion", label: "Aprobación" },
  { key: "vigente", label: "Vigente" },
]

export function PanelWorkflow({
  workflow,
  onEnviarRevision,
  onAprobar,
  onRechazar,
  onDarDeBaja,
}: PanelWorkflowProps) {
  const [showRechazar, setShowRechazar] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [comentario, setComentario] = useState("")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const estadoConfig = ESTADO_CONFIG[workflow.estado] || ESTADO_CONFIG.borrador
  const EstadoIcon = estadoConfig.icon
  const currentStepIndex = STEPS.findIndex((s) => s.key === workflow.estado)

  const handleAction = async (action: string) => {
    setLoadingAction(action)
    try {
      switch (action) {
        case "enviar_revision":
          await onEnviarRevision(comentario || undefined)
          toast.success("Documento enviado a revisión")
          break
        case "aprobar":
          await onAprobar(comentario || undefined)
          toast.success("Aprobado exitosamente")
          break
        case "rechazar":
          if (!motivoRechazo.trim()) {
            toast.error("Debe ingresar un motivo de rechazo")
            setLoadingAction(null)
            return
          }
          await onRechazar(motivoRechazo, comentario || undefined)
          toast.success("Documento rechazado")
          setShowRechazar(false)
          setMotivoRechazo("")
          break
        case "dar_de_baja":
          await onDarDeBaja()
          toast.success("Documento dado de baja")
          break
      }
      setComentario("")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error al realizar la acción")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h3 className="font-semibold text-sm">Workflow de Aprobación</h3>
          </div>
          <Badge estado={workflow.estado}>{estadoConfig.label}</Badge>
        </div>

        {expanded && (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center gap-1 flex-1">
                  <div
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      i <= currentStepIndex ? "bg-primary" : "bg-border"
                    )}
                  />
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    i <= currentStepIndex ? "text-primary" : "text-muted"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Participantes */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted" />
                <span className="text-muted">Elaborador:</span>
                <span className="font-medium">{workflow.elaborador_nombre || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted" />
                <span className="text-muted">Revisor:</span>
                <span className="font-medium">{workflow.revisor_nombre || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted" />
                <span className="text-muted">Aprobador:</span>
                <span className="font-medium">{workflow.aprobador_nombre || "—"}</span>
              </div>
            </div>

            {/* Motivo de rechazo */}
            {workflow.motivo_rechazo && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
                  <AlertTriangle className="w-4 h-4" /> Último rechazo
                </div>
                <p className="text-red-300">{workflow.motivo_rechazo}</p>
              </div>
            )}

            {/* Acciones */}
            {workflow.acciones_disponibles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                {workflow.acciones_disponibles.includes("enviar_revision") && (
                  <Button className="w-full" onClick={() => handleAction("enviar_revision")} disabled={!!loadingAction}>
                    <Send className="w-4 h-4 mr-2" /> Enviar a Revisión
                  </Button>
                )}
                {workflow.acciones_disponibles.includes("aprobar") && (
                  <Button className="w-full" variant="success" onClick={() => handleAction("aprobar")} disabled={!!loadingAction}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                  </Button>
                )}
                {workflow.acciones_disponibles.includes("rechazar") && (
                  <Button className="w-full" variant="danger" onClick={() => setShowRechazar(!showRechazar)} disabled={!!loadingAction}>
                    <XCircle className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                )}
                {workflow.acciones_disponibles.includes("dar_de_baja") && (
                  <Button className="w-full" variant="warning" onClick={() => handleAction("dar_de_baja")} disabled={!!loadingAction}>
                    <Archive className="w-4 h-4 mr-2" /> Dar de Baja
                  </Button>
                )}
              </div>
            )}

            {/* Formulario de rechazo */}
            {showRechazar && (
              <div className="space-y-2 p-3 rounded-lg bg-surface border border-border">
                <label className="text-sm font-medium text-red-400">Motivo de rechazo *</label>
                <Input
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ingrese el motivo del rechazo..."
                />
                <label className="text-sm text-muted">Comentario adicional</label>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario opcional..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => handleAction("rechazar")} disabled={!!loadingAction}>
                    Confirmar Rechazo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowRechazar(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Comentario para aprobación/envío */}
            {(workflow.acciones_disponibles.includes("aprobar") || workflow.acciones_disponibles.includes("enviar_revision")) && !showRechazar && (
              <div>
                <label className="text-xs text-muted mb-1 block">Comentario (opcional)</label>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agregar comentario..."
                  rows={2}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
