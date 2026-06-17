"use client"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { VersionDocumento } from "@/types/documento"
import { formatDate } from "@/lib/utils"

interface VersionHistoryProps {
  versiones: VersionDocumento[]
}

export function VersionHistory({ versiones }: VersionHistoryProps) {
  return (
    <div className="space-y-2">
      {versiones.length === 0 ? (
        <p className="text-sm text-muted">Sin versiones registradas</p>
      ) : (
        versiones.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
            <div>
              <p className="text-sm font-medium text-text">Versión {v.numero_version}</p>
              {v.motivo_cambio && <p className="text-xs text-muted mt-0.5">{v.motivo_cambio}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{formatDate(v.created_at)}</span>
              <BadgeEstado estado={v.estado} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
