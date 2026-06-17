"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronDown, ChevronRight, Clock, Send, CheckCircle, XCircle,
  Edit, Save, Archive, User
} from "lucide-react"
import { HistorialEntry } from "@/types/documento"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface TimelineHistorialProps {
  historial: HistorialEntry[]
}

const ACCION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  crear: { label: "Creó el documento", icon: Edit, color: "text-blue-400" },
  editar: { label: "Editó el documento", icon: Edit, color: "text-gray-400" },
  auto_save: { label: "Guardado automático", icon: Save, color: "text-gray-500" },
  enviar_revision: { label: "Envió a revisión", icon: Send, color: "text-yellow-400" },
  aprobar_revision: { label: "Aprobó la revisión", icon: CheckCircle, color: "text-green-400" },
  aprobar: { label: "Aprobó el documento", icon: CheckCircle, color: "text-green-400" },
  rechazar: { label: "Rechazó el documento", icon: XCircle, color: "text-red-400" },
  dar_de_baja: { label: "Dio de baja", icon: Archive, color: "text-red-400" },
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-gray-400",
  en_revision: "bg-yellow-400",
  en_aprobacion: "bg-blue-400",
  vigente: "bg-green-400",
  obsoleto: "bg-red-400",
}

export function TimelineHistorial({ historial }: TimelineHistorialProps) {
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const visibleHistorial = showAll ? historial : historial.slice(0, 10)
  const autoSaves = historial.filter((h) => h.accion === "auto_save")
  const significantActions = historial.filter((h) => h.accion !== "auto_save")

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h3 className="font-semibold text-sm">Historial de Cambios</h3>
          </div>
          <span className="text-xs text-muted">{significantActions.length} acciones</span>
        </div>

        {expanded && (
          <div className="space-y-0">
            {visibleHistorial.map((entry, i) => {
              const config = ACCION_CONFIG[entry.accion] || ACCION_CONFIG.editar
              const Icon = config.icon
              const isAutoSave = entry.accion === "auto_save"

              return (
                <div key={entry.id} className="flex gap-3 relative">
                  {/* Línea vertical */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center z-10",
                      isAutoSave ? "bg-border/50" : "bg-surface border-2 border-current",
                      config.color
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < visibleHistorial.length - 1 && (
                      <div className="w-px h-full bg-border min-h-[20px]" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className={cn("pb-4 flex-1", isAutoSave && "opacity-50")}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", config.color)}>
                        {config.label}
                      </span>
                      {!isAutoSave && entry.estado_nuevo && (
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          ESTADO_COLORS[entry.estado_nuevo] || "bg-gray-400"
                        )} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <User className="w-3 h-3" />
                      <span>{entry.usuario_nombre}</span>
                      <span>·</span>
                      <span>{formatDate(entry.created_at)}</span>
                      {entry.version_numero && (
                        <>
                          <span>·</span>
                          <span>v{entry.version_numero}</span>
                        </>
                      )}
                    </div>
                    {entry.comentario && (
                      <p className="text-xs text-muted mt-1 italic">
                        &ldquo;{entry.comentario}&rdquo;
                      </p>
                    )}
                    {entry.estado_anterior && entry.estado_nuevo && entry.estado_anterior !== entry.estado_nuevo && (
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <span className="text-muted">{entry.estado_anterior}</span>
                        <span className="text-muted">→</span>
                        <span className="font-medium">{entry.estado_nuevo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {historial.length > 10 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs text-primary hover:underline ml-11"
              >
                Ver todo el historial ({historial.length} entradas)
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
