"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createDocumento } from "@/hooks/useDocumentos"
import { extractErrorMessage } from "@/lib/utils"
import { toast } from "sonner"
import { ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { TIPOS_DOCUMENTO, NORMAS_ISO, getTipoConfig, getNormasPorTipo } from "@/lib/constants"

const TIPOS_SELECT = TIPOS_DOCUMENTO.map((t) => ({ value: t.value, label: t.label }))

export default function NuevoDocumentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    codigo: "",
    titulo: "",
    tipo: "sop",
    contenido_html: "",
  })

  const tipoConfig = useMemo(() => getTipoConfig(form.tipo), [form.tipo])
  const normasActivas = useMemo(() => getNormasPorTipo(form.tipo), [form.tipo])

  const handleTipoChange = (nuevoTipo: string) => {
    const config = getTipoConfig(nuevoTipo)
    if (config) {
      setForm((prev) => ({
        ...prev,
        tipo: nuevoTipo,
        codigo: `${config.prefijo}-`,
      }))
    } else {
      setForm((prev) => ({ ...prev, tipo: nuevoTipo }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const doc = await createDocumento({
        ...form,
        iso_norma: normasActivas,
      })
      toast.success("Documento creado exitosamente")
      router.push(`/documentos/${doc.id}`)
    } catch (err) {
      toast.error(extractErrorMessage(err, "Error al crear documento"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documentos">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">Nuevo Documento</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Tipo de Documento</label>
                <Select
                  options={TIPOS_SELECT}
                  value={form.tipo}
                  onChange={(e) => handleTipoChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Código</label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder={`${tipoConfig?.prefijo || "DOC"}-001`}
                  required
                />
                <p className="text-xs text-muted mt-1">Prefijo: {tipoConfig?.prefijo || "DOC"}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Título</label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Título del documento"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Normas ISO que Aplican</label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-background/50 border border-border/50 min-h-[42px]">
                {normasActivas.map((norma) => {
                  const normaInfo = NORMAS_ISO.find((n) => n.value === norma)
                  return (
                    <Badge key={norma} estado="vigente" className="text-xs">
                      {normaInfo?.label || norma}
                    </Badge>
                  )
                })}
              </div>
              <p className="text-xs text-muted mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Las normas se asignan automáticamente según el tipo de documento
              </p>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Contenido</label>
              <Textarea
                value={form.contenido_html}
                onChange={(e) => setForm({ ...form, contenido_html: e.target.value })}
                placeholder="Escribe el contenido del documento aquí..."
                rows={12}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()} type="button">Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Documento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
