"use client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  onClick: () => void
  label?: string
}

export function ExportButton({ onClick, label = "Exportar PDF" }: ExportButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
