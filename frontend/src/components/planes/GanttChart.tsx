"use client"
import { Progress } from "@/components/ui/progress"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { TareaPlan } from "@/types/plan"
import { formatDate } from "@/lib/utils"

interface GanttChartProps {
  tareas: TareaPlan[]
}

export function GanttChart({ tareas }: GanttChartProps) {
  if (tareas.length === 0) return <p className="text-sm text-muted">Sin tareas registradas</p>

  return (
    <div className="space-y-4">
      {tareas.map((tarea) => (
        <div key={tarea.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text">{tarea.nombre}</span>
              <BadgeEstado estado={tarea.estado} />
            </div>
            <span className="text-xs text-muted">
              {formatDate(tarea.fecha_inicio)} - {formatDate(tarea.fecha_fin)}
            </span>
          </div>
          <Progress value={tarea.progreso} variant={tarea.progreso >= 100 ? "success" : "default"} />
          <div className="flex justify-between text-xs text-muted">
            <span>{tarea.progreso}%</span>
            {tarea.observaciones && <span className="italic">{tarea.observaciones}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
