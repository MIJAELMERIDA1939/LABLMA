import { Badge } from "@/components/ui/badge"

export function BadgeEstado({ estado }: { estado: string }) {
  return <Badge estado={estado}>{estado.replace(/_/g, " ")}</Badge>
}
