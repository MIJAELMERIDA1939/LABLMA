import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface Alerta {
  tipo: string
  titulo: string
  mensaje: string
  fecha_limite?: string
}

interface AlertasPendientesProps {
  alertas: Alerta[]
}

export function AlertasPendientes({ alertas }: AlertasPendientesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas Próximos Vencimientos</CardTitle>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <p className="text-sm text-muted">Sin alertas pendientes</p>
        ) : (
          <div className="space-y-3">
            {alertas.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">{a.titulo}</p>
                  <p className="text-xs text-muted mt-1">{a.mensaje}</p>
                  {a.fecha_limite && (
                    <p className="text-xs text-warning mt-1">Vence: {a.fecha_limite}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
