import * as React from "react"
import { cn, getEstadoColor } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  estado: string
}

export function Badge({ estado, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getEstadoColor(estado),
        className
      )}
      {...props}
    />
  )
}
