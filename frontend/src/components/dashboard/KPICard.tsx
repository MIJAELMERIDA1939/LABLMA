import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  variant?: "default" | "success" | "danger" | "warning"
}

export function KPICard({ title, value, icon: Icon, variant = "default" }: KPICardProps) {
  const colors = {
    default: "text-primary",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", colors[variant])}>{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg bg-surface/50", colors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  )
}
