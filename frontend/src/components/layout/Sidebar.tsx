"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Users,
  Settings,
  ChevronLeft,
  PenSquare,
} from "lucide-react"
import { useState } from "react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/edicion", label: "Edición", icon: PenSquare },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/no-conformidades", label: "No Conformidades", icon: AlertTriangle },
  { href: "/riesgos", label: "Riesgos", icon: ShieldAlert },
  { href: "/planes", label: "Planes", icon: Calendar },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "h-screen bg-surface border-r border-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && <span className="font-bold text-text text-lg">SGC</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted hover:text-text transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-text hover:bg-surface/50"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
