"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorRico } from "@/components/edicion/EditorRico"
import { DocumentoEdicion } from "@/types/edicion"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  FileDown,
  ArrowLeft,
  Save,
  Loader2,
  Search,
  File,
  AlertCircle,
} from "lucide-react"

type View = "list" | "editor"

export default function EdicionPage() {
  const [view, setView] = useState<View>("list")
  const [documentos, setDocumentos] = useState<DocumentoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [docActual, setDocActual] = useState<DocumentoEdicion | null>(null)
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [libreofficeOk, setLibreofficeOk] = useState(false)

  const cargarDocs = useCallback(async () => {
    try {
      const res = await api.get("/edicion")
      setDocumentos(res.data)
    } catch {
      toast.error("Error al cargar documentos")
    } finally {
      setLoading(false)
    }
  }, [])

  const verificarLibreOffice = useCallback(async () => {
    try {
      const res = await api.get("/edicion/libreoffice/status")
      setLibreofficeOk(res.data.instalado)
    } catch {
      setLibreofficeOk(false)
    }
  }, [])

  useEffect(() => {
    cargarDocs()
    verificarLibreOffice()
  }, [cargarDocs, verificarLibreOffice])

  const handleCrear = async () => {
    const form = new FormData()
    form.append("titulo", "Nuevo documento")
    form.append("contenido_html", "<h1></h1><p></p>")

    try {
      const res = await api.post("/edicion/crear", form)
      setDocActual(res.data)
      setTitulo(res.data.titulo)
      setContenido(res.data.contenido_html || "<h1></h1><p></p>")
      setView("editor")
      toast.success("Documento creado")
      await cargarDocs()
    } catch {
      toast.error("Error al crear documento")
    }
  }

  const handleAbrir = async (doc: DocumentoEdicion) => {
    try {
      const res = await api.get(`/edicion/${doc.id}`)
      setDocActual(res.data)
      setTitulo(res.data.titulo)
      setContenido(res.data.contenido_html || "")
      setView("editor")
    } catch {
      toast.error("Error al abrir documento")
    }
  }

  const handleGuardar = async () => {
    if (!docActual) return
    setSaving(true)

    const form = new FormData()
    form.append("titulo", titulo)
    form.append("contenido_html", contenido)

    try {
      await api.put(`/edicion/${docActual.id}`, form)
      toast.success("Documento guardado")
      await cargarDocs()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return
    try {
      await api.delete(`/edicion/${id}`)
      toast.success("Documento eliminado")
      if (docActual?.id === id) {
        setDocActual(null)
        setView("list")
      }
      await cargarDocs()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const handleExportar = async (formato: string) => {
    if (!docActual) return
    if (!libreofficeOk) {
      toast.error("LibreOffice no está instalado. Descárgalo desde https://www.libreoffice.org/download/")
      return
    }
    setExporting(true)

    const form = new FormData()
    form.append("formato", formato)

    try {
      const res = await api.post(`/edicion/${docActual.id}/exportar`, form, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")
      a.href = url
      a.download = `${titulo}.${formato}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Exportado como ${formato.toUpperCase()}`)
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al exportar"
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append("archivo", file)

    try {
      const res = await api.post("/edicion/importar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setDocActual(res.data)
      setTitulo(res.data.titulo)
      setContenido(res.data.contenido_html || "")
      setView("editor")
      toast.success("Documento importado")
      await cargarDocs()
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al importar"
      toast.error(msg)
    }

    e.target.value = ""
  }

  const volverAlListado = () => {
    setDocActual(null)
    setView("list")
  }

  const docsFiltrados = documentos.filter(
    (d) =>
      d.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      d.creado_por?.toLowerCase().includes(search.toLowerCase())
  )

  if (view === "editor" && docActual) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={volverAlListado}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="text-xl font-bold text-text bg-transparent border-none focus:outline-none w-96"
              placeholder="Título del documento"
            />
          </div>
          <div className="flex items-center gap-2">
            {!libreofficeOk && (
              <span className="text-xs text-yellow-400 flex items-center gap-1 mr-2">
                <AlertCircle className="w-3 h-3" />
                Sin LibreOffice
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExportar("docx")}
              disabled={exporting || !libreofficeOk}
              title="Exportar a Word"
            >
              <FileDown className="w-4 h-4 mr-1" /> Word
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExportar("pdf")}
              disabled={exporting || !libreofficeOk}
              title="Exportar a PDF"
            >
              <FileDown className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" onClick={handleGuardar} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        <EditorRico content={contenido} onChange={setContenido} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Edición</h1>
          <p className="text-sm text-muted mt-1">
            {documentos.length} documento{documentos.length !== 1 ? "s" : ""}
            {!libreofficeOk && (
              <span className="ml-3 text-yellow-400 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                LibreOffice no detectado
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCrear}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo
          </Button>
          <label className="cursor-pointer">
            <div className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-surface text-text">
              <Upload className="w-4 h-4 mr-1" /> Importar
            </div>
            <input
              type="file"
              accept=".docx,.odt,.html,.htm,.rtf,.txt"
              onChange={handleImportar}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {!libreofficeOk && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-text">
                <p className="font-medium mb-1">LibreOffice no está instalado</p>
                <p className="text-muted text-xs">
                  Para exportar a Word, PDF y ODT, e importar documentos .docx, instala
                  LibreOffice desde{" "}
                  <a
                    href="https://www.libreoffice.org/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    libreoffice.org/download
                  </a>
                  . Mientras tanto, puedes crear y editar documentos en formato HTML.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Buscar documentos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : docsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Ningún documento todavía</p>
            <p className="text-xs mt-1">Crea un nuevo documento o importa uno existente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docsFiltrados.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleAbrir(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-text truncate">
                        {doc.titulo}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {doc.creado_por} &middot;{" "}
                        {new Date(doc.updated_at).toLocaleDateString("es-BO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEliminar(doc.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
