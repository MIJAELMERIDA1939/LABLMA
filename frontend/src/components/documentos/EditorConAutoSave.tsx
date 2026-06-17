"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface EditorConAutoSaveProps {
  documentoId: string
  contenidoInicial: string
  tituloInicial: string
  estado: string
  onContenidoChange?: (contenido: string) => void
  onTituloChange?: (titulo: string) => void
}

export function EditorConAutoSave({
  documentoId,
  contenidoInicial,
  tituloInicial,
  estado,
  onContenidoChange,
  onTituloChange,
}: EditorConAutoSaveProps) {
  const [contenido, setContenido] = useState(contenidoInicial)
  const [titulo, setTitulo] = useState(tituloInicial)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const isEditable = estado === "borrador"

  useEffect(() => {
    setContenido(contenidoInicial)
    setTitulo(tituloInicial)
  }, [contenidoInicial, tituloInicial])

  const save = useCallback(async (showToast = false) => {
    if (!isEditable) return
    setSaving(true)
    try {
      await api.put(`/documentos/${documentoId}/auto-save`, {
        contenido_html: contenido,
        titulo: titulo,
      })
      setLastSaved(new Date())
      setHasChanges(false)
      if (showToast) toast.success("Cambios guardados")
    } catch (err) {
      if (showToast) toast.error("Error al guardar")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [documentoId, contenido, titulo, isEditable])

  useEffect(() => {
    if (!isEditable || !hasChanges) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(false), 30000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [contenido, titulo, hasChanges, isEditable, save])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasChanges])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        save(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [save])

  const handleContenidoChange = (value: string) => {
    setContenido(value)
    setHasChanges(true)
    onContenidoChange?.(value)
  }

  const handleTituloChange = (value: string) => {
    setTitulo(value)
    setHasChanges(true)
    onTituloChange?.(value)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm text-muted mb-1">Título del Documento</label>
          <Input
            value={titulo}
            onChange={(e) => handleTituloChange(e.target.value)}
            disabled={!isEditable}
            placeholder="Título del documento"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <div className="flex items-center gap-2 text-xs text-muted">
            {saving ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</>
            ) : lastSaved ? (
              <><CheckCircle className="w-3 h-3 text-green-400" /> Guardado {formatTime(lastSaved)}</>
            ) : hasChanges ? (
              <><AlertCircle className="w-3 h-3 text-yellow-400" /> Sin guardar</>
            ) : null}
          </div>
          {isEditable && (
            <Button
              size="sm"
              onClick={() => save(true)}
              disabled={saving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-1" /> Guardar
            </Button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted mb-1">Contenido</label>
        <Textarea
          value={contenido}
          onChange={(e) => handleContenidoChange(e.target.value)}
          disabled={!isEditable}
          rows={30}
          className="font-mono text-sm leading-relaxed"
          placeholder="Escribe el contenido del documento aquí..."
        />
      </div>

      {!isEditable && (
        <div className="p-3 rounded-lg bg-surface border border-border text-sm text-muted">
          Este documento no está en estado borrador. Solo el elaborador puede editarlo.
        </div>
      )}
    </div>
  )
}
