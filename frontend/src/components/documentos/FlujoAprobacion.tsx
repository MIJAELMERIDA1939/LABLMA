"use client"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Clock, XCircle } from "lucide-react"

const STEPS = [
  { estado: "borrador", label: "Borrador", icon: Circle },
  { estado: "en_revision", label: "En Revisión", icon: Clock },
  { estado: "vigente", label: "Vigente", icon: CheckCircle },
]

interface FlujoAprobacionProps {
  estadoActual: string
}

export function FlujoAprobacion({ estadoActual }: FlujoAprobacionProps) {
  const currentIndex = STEPS.findIndex((s) => s.estado === estadoActual)

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i <= currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={step.estado} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                isActive ? "bg-primary/10 text-primary" : "text-muted"
              )}
            >
              <Icon className={cn("w-4 h-4", isCurrent && "animate-pulse")} />
              <span className={cn("font-medium", isCurrent && "text-primary")}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-0.5", i < currentIndex ? "bg-primary" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}
