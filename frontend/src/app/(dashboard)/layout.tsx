"use client"
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Toaster } from "sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-end px-6 border-b border-border bg-surface h-16">
          <NotificationBell />
          <Navbar />
        </div>
        <main className="flex-1 p-6 overflow-auto">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#1A1D27", border: "1px solid #2A2D3A", color: "#E8E8ED" },
            }}
          />
        </main>
      </div>
    </div>
  )
}
