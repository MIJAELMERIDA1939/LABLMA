"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChartDocumentosProps {
  porTipo: Record<string, number>
  porEstado: Record<string, number>
}

export function ChartDocumentos({ porTipo, porEstado }: ChartDocumentosProps) {
  const tipoData = Object.entries(porTipo || {}).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={tipoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
            <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
            <YAxis stroke="#64748B" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#1A1D27", border: "1px solid #2A2D3A", borderRadius: 8 }}
              labelStyle={{ color: "#E2E8F0" }}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
