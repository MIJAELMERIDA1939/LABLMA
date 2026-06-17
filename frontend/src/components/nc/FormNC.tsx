"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import api from "@/lib/api"
import { extractErrorMessage } from "@/lib/utils"
import { useRouter } from "next/navigation"

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

export function FormNC({ onSuccess }: { onSuccess?: () => void }) {
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
      if (onSuccess) onSuccess()
      router.push("/no-conformidades")
    } catch (err: any) {
      alert(extractErrorMessage(err, "Error al crear NC"))
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <label className="block text-sm text-muted mb-1">Fecha Detección</label>
          <Input type="date" value={form.fecha_deteccion} onChange={(e) => setForm({ ...form, fecha_deteccion: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Fecha Límite</label>
          <Input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Descripción</label>
        <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={4} required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Registrar NC"}</Button>
    </form>
  )
}
