"use client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
      <div>
        <h2 className="text-text font-semibold">Sistema de Gestión de Calidad</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted">
          <User className="w-4 h-4" />
          <span className="text-sm">{user?.nombre}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{user?.rol}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
