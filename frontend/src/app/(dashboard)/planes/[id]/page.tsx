"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PlanPrograma } from "@/types/plan"
import { formatDate } from "@/lib/utils"

export default function PlanDetailPage() {
  const { id } = useParams()
  const [plan, setPlan] = useState<PlanPrograma | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/planes/${id}`).then((r) => setPlan(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center text-muted p-12">Cargando...</div>
  if (!plan) return <div className="text-center text-muted p-12">Plan no encontrado</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/planes"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-text">{plan.titulo}</h1>
        <BadgeEstado estado={plan.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Diagrama Gantt</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.tareas.map((t) => {
                  const start = new Date(t.fecha_inicio)
                  const end = new Date(t.fecha_fin)
                  const total = plan.tareas.length
                  return (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text">{t.nombre}</span>
                        <span className="text-xs text-muted">{formatDate(t.fecha_inicio)} - {formatDate(t.fecha_fin)}</span>
                      </div>
                      <div className="h-6 rounded-lg bg-background relative overflow-hidden">
                        <div
                          className="h-full rounded-lg bg-primary/30 border border-primary/50"
                          style={{ width: `${(1 / total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <BadgeEstado estado={t.estado} />
                        <span className="text-xs text-muted">{t.progreso}% completo</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs text-muted">Año</p><p className="text-sm">{plan.ano}</p></div>
              <div><p className="text-xs text-muted">Tareas</p><p className="text-sm">{plan.tareas.length}</p></div>
              <div><p className="text-xs text-muted">Creado</p><p className="text-sm">{formatDate(plan.created_at)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Progreso General</CardTitle></CardHeader>
            <CardContent>
              {plan.tareas.length > 0 ? (
                <div>
                  <div className="h-3 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${plan.tareas.reduce((a, t) => a + t.progreso, 0) / plan.tareas.length}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted mt-2 text-center">
                    {Math.round(plan.tareas.reduce((a, t) => a + t.progreso, 0) / plan.tareas.length)}% completo
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">Sin tareas</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
