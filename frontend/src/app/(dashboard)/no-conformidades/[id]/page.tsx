"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, extractErrorMessage } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { NoConformidad } from "@/types/nc"

export default function NCDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [nc, setNc] = useState<NoConformidad | null>(null)
  const [loading, setLoading] = useState(true)
  const [analisis, setAnalisis] = useState({ analisis_causa: "", correccion: "" })
  const [validacion, setValidacion] = useState({ eficaz: true, observaciones: "" })

  useEffect(() => {
    api.get(`/nc/${id}`).then((r) => {
      setNc(r.data)
      setAnalisis({ analisis_causa: r.data.analisis_causa || "", correccion: r.data.correccion || "" })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleAction = async (action: string, body?: any) => {
    try {
      await api.post(`/nc/${id}/${action}`, body || {})
      const r = await api.get(`/nc/${id}`)
      setNc(r.data)
    } catch (err: any) {
      alert(extractErrorMessage(err, "Error al realizar la acción"))
    }
  }

  if (loading) return <div className="text-center text-muted p-12">Cargando...</div>
  if (!nc) return <div className="text-center text-muted p-12">NC no encontrada</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/no-conformidades">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">{nc.codigo}</h1>
        <BadgeEstado estado={nc.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{nc.descripcion}</p></CardContent>
          </Card>

          {nc.estado === "abierta" && (
            <Card>
              <CardHeader><CardTitle>Análisis de Causa y Corrección</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Análisis de Causa</label>
                  <Textarea value={analisis.analisis_causa} onChange={(e) => setAnalisis({ ...analisis, analisis_causa: e.target.value })} rows={3} />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Corrección</label>
                  <Textarea value={analisis.correccion} onChange={(e) => setAnalisis({ ...analisis, correccion: e.target.value })} rows={3} />
                </div>
                <Button onClick={() => handleAction("analisis", analisis)}>Guardar Análisis</Button>
              </CardContent>
            </Card>
          )}

          {nc.analisis_causa && (
            <Card>
              <CardHeader><CardTitle>Análisis de Causa</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{nc.analisis_causa}</p></CardContent>
            </Card>
          )}
          {nc.correccion && (
            <Card>
              <CardHeader><CardTitle>Corrección</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{nc.correccion}</p></CardContent>
            </Card>
          )}

          {nc.planes_accion.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Plan de Acción</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted p-2">Actividad</th>
                      <th className="text-left text-xs text-muted p-2">Estado</th>
                      <th className="text-left text-xs text-muted p-2">Fecha Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nc.planes_accion.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="p-2 text-sm">{p.actividad}</td>
                        <td className="p-2"><BadgeEstado estado={p.estado} /></td>
                        <td className="p-2 text-sm text-muted">{formatDate(p.fecha_fin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {nc.estado === "cerrada" && nc.eficaz === null && (
            <Card>
              <CardHeader><CardTitle>Validar Cierre</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="eficaz" checked={validacion.eficaz === true} onChange={() => setValidacion({ ...validacion, eficaz: true })} />
                    Eficaz
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="eficaz" checked={validacion.eficaz === false} onChange={() => setValidacion({ ...validacion, eficaz: false })} />
                    No Eficaz
                  </label>
                </div>
                <Button onClick={() => handleAction("validar-cierre", validacion)}>Validar Cierre</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs text-muted">Tipo</p><p className="text-sm">{nc.tipo}</p></div>
              <div><p className="text-xs text-muted">Clasificación</p><p className="text-sm">{nc.clasificacion}</p></div>
              <div><p className="text-xs text-muted">Fuente</p><p className="text-sm">{nc.fuente || "—"}</p></div>
              <div><p className="text-xs text-muted">Área</p><p className="text-sm">{nc.area_afectada || "—"}</p></div>
              <div><p className="text-xs text-muted">Detección</p><p className="text-sm">{formatDate(nc.fecha_deteccion)}</p></div>
              <div><p className="text-xs text-muted">Fecha Límite</p><p className="text-sm">{formatDate(nc.fecha_limite)}</p></div>
              <div><p className="text-xs text-muted">Cierre</p><p className="text-sm">{formatDate(nc.fecha_cierre)}</p></div>
              <div><p className="text-xs text-muted">Eficaz</p><p className="text-sm">{nc.eficaz === null ? "Pendiente" : nc.eficaz ? "Sí" : "No"}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nc.estado === "en_analisis" && <Button className="w-full" onClick={() => handleAction("aprobar-plan")}>Aprobar Plan</Button>}
              {nc.estado === "plan_aprobado" && <Button className="w-full" onClick={() => handleAction("cerrar")}>Cerrar NC</Button>}
              {nc.estado === "en_ejecucion" && <Button className="w-full" onClick={() => handleAction("cerrar")}>Reportar Cierre</Button>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
