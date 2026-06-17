"use client"
import { cn } from "@/lib/utils"
import { AlertTriangle, Search, FileCheck, Hammer, CheckCircle, ThumbsUp } from "lucide-react"

const STEPS = [
  { estado: "abierta", label: "Abierta", icon: AlertTriangle },
  { estado: "en_analisis", label: "Análisis", icon: Search },
  { estado: "plan_aprobado", label: "Plan Aprobado", icon: FileCheck },
  { estado: "en_ejecucion", label: "Ejecución", icon: Hammer },
  { estado: "cerrada", label: "Cerrada", icon: CheckCircle },
]

interface FlujoCierreProps {
  estadoActual: string
}

export function FlujoCierre({ estadoActual }: FlujoCierreProps) {
  const currentIndex = STEPS.findIndex((s) => s.estado === estadoActual)

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i <= currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={step.estado} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap",
                isActive ? "bg-primary/10 text-primary" : "text-muted bg-background/50"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isCurrent && "animate-pulse")} />
              <span>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-6 h-0.5", i < currentIndex ? "bg-primary" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}
