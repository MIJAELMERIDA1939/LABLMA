"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import api from "@/lib/api"
import { extractErrorMessage } from "@/lib/utils"

const TIPOS = [
  { value: "NC", label: "No Conformidad (NC)" },
  { value: "TNC", label: "Trabajo No Conforme (TNC)" },
  { value: "oportunidad_mejora", label: "Oportunidad de Mejora" },
]

const CLASIFICACIONES = [
  { value: "critica", label: "Crítica" },
  { value: "mayor", label: "Mayor" },
  { value: "menor", label: "Menor" },
]

export default function NuevaNCPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    codigo: "",
    tipo: "NC",
    fuente: "",
    fecha_deteccion: new Date().toISOString().split("T")[0],
    descripcion: "",
    area_afectada: "",
    clasificacion: "menor",
    fecha_limite: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/nc", form)
      router.push("/no-conformidades")
    } catch (err: any) {
      alert(extractErrorMessage(err, "Error al crear NC"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text">Registrar No Conformidad</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Código</label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="NC-2025-001" required />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Tipo</label>
                <Select options={TIPOS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Fuente / Origen</label>
                <Input value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} placeholder="Auditoría Interna" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Clasificación</label>
                <Select options={CLASIFICACIONES} value={form.clasificacion} onChange={(e) => setForm({ ...form, clasificacion: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Fecha de Detección</label>
                <Input type="date" value={form.fecha_deteccion} onChange={(e) => setForm({ ...form, fecha_deteccion: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Fecha Límite</label>
                <Input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Área Afectada</label>
              <Input value={form.area_afectada} onChange={(e) => setForm({ ...form, area_afectada: e.target.value })} placeholder="Laboratorio de Suelos" />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Descripción</label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={4} required />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creando..." : "Registrar NC"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
