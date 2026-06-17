import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  className?: string
  variant?: "default" | "success" | "warning"
}

export function Progress({ value, className, variant = "default" }: ProgressProps) {
  const colors = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  }

  return (
    <div className={cn("h-2 rounded-full bg-border overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[variant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
