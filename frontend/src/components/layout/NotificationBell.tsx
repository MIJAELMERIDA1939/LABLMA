"use client"
import { useNotificaciones } from "@/hooks/useNotificaciones"
import { Bell } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const { notificaciones, marcarLeida, marcarTodasLeidas } = useNotificaciones()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-muted hover:text-text transition-colors"
      >
        <Bell className="w-5 h-5" />
        {notificaciones.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
            {notificaciones.length > 9 ? "9+" : notificaciones.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-semibold text-text">Notificaciones</span>
            {notificaciones.length > 0 && (
              <button onClick={marcarTodasLeidas} className="text-xs text-primary hover:underline">
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="text-sm text-muted p-4 text-center">Sin notificaciones pendientes</p>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  className="p-3 border-b border-border/50 hover:bg-surface/50 cursor-pointer"
                  onClick={() => marcarLeida(n.id)}
                >
                  <p className="text-sm font-medium text-text">{n.titulo}</p>
                  {n.mensaje && <p className="text-xs text-muted mt-1">{n.mensaje}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
