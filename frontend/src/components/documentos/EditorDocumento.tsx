"use client"
import { useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"

interface EditorDocumentoProps {
  value: string
  onChange: (value: string) => void
  readonly?: boolean
}

export function EditorDocumento({ value, onChange, readonly = false }: EditorDocumentoProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readonly}
        rows={20}
        className="font-mono text-sm"
        placeholder="Escribe el contenido del documento aquí... Puedes usar HTML para formato."
      />
    </div>
  )
}
