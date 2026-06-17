"use client"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { KPICard } from "@/components/dashboard/KPICard"
import { ChartNC } from "@/components/dashboard/ChartNC"
import { ChartDocumentos } from "@/components/dashboard/ChartDocumentos"
import { AlertasPendientes } from "@/components/dashboard/AlertasPendientes"
import { FileText, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react"

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>({})
  const [docStats, setDocStats] = useState<any>({})
  const [ncStats, setNcStats] = useState<any>({})
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    api.get("/dashboard/kpis").then((r) => setKpis(r.data)).catch(() => {})
    api.get("/dashboard/documentos").then((r) => setDocStats(r.data)).catch(() => {})
    api.get("/dashboard/nc").then((r) => setNcStats(r.data)).catch(() => {})
    api.get("/dashboard/alertas").then((r) => setAlertas(r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Documentos Vigentes" value={kpis.documentos_vigentes || 0} icon={FileText} variant="success" />
        <KPICard title="NC Abiertas" value={kpis.nc_abiertas || 0} icon={AlertTriangle} variant="warning" />
        <KPICard title="NC Vencidas" value={kpis.nc_vencidas || 0} icon={AlertTriangle} variant="danger" />
        <KPICard title="Riesgos Activos" value={kpis.riesgos_activos || 0} icon={ShieldAlert} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartNC data={ncStats.por_estado} />
        <ChartDocumentos porTipo={docStats.por_tipo} porEstado={docStats.por_estado} />
      </div>

      <AlertasPendientes alertas={alertas} />
    </div>
  )
}
