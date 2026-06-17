import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"

export const metadata: Metadata = {
  title: "SGC - Sistema de Gestión de Calidad",
  description: "Sistema integral para la gestión documental, no conformidades, riesgos y planes",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
