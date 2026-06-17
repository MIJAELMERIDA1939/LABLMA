"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Riesgo } from "@/types/riesgo"
import { formatDate } from "@/lib/utils"

export default function RiesgoDetailPage() {
  const { id } = useParams()
  const [riesgo, setRiesgo] = useState<Riesgo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/riesgos/${id}`).then((r) => setRiesgo(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center text-muted p-12">Cargando...</div>
  if (!riesgo) return <div className="text-center text-muted p-12">Riesgo no encontrado</div>

  const nivel = riesgo.probabilidad * riesgo.impacto

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/riesgos"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-text">{riesgo.codigo}</h1>
        <BadgeEstado estado={riesgo.estado} />
      </div>

      <Card>
        <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{riesgo.descripcion}</p></CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Probabilidad</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{riesgo.probabilidad}/5</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Impacto</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{riesgo.impacto}/5</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Nivel de Riesgo</CardTitle></CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-warning">{nivel}</p>
          <p className="text-sm text-muted mt-1">Probabilidad × Impacto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-xs text-muted">Proceso</p><p className="text-sm">{riesgo.proceso || "—"}</p></div>
          <div><p className="text-xs text-muted">Tratamiento</p><p className="text-sm">{riesgo.tipo_tratamiento || "—"}</p></div>
          <div><p className="text-xs text-muted">Acción</p><p className="text-sm">{riesgo.accion || "—"}</p></div>
          <div><p className="text-xs text-muted">Fecha Revisión</p><p className="text-sm">{formatDate(riesgo.fecha_revision)}</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
