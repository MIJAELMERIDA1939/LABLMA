"use client"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeEstado } from "@/components/shared/BadgeEstado"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NoConformidad } from "@/types/nc"
import { formatDate } from "@/lib/utils"

interface MatrizNCProps {
  ncs: NoConformidad[]
  loading?: boolean
}

export function MatrizNC({ ncs, loading }: MatrizNCProps) {
  if (loading) return <p className="text-muted text-sm">Cargando...</p>

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted p-3">Código</th>
              <th className="text-left text-xs text-muted p-3">Descripción</th>
              <th className="text-left text-xs text-muted p-3">Tipo</th>
              <th className="text-left text-xs text-muted p-3">Clasificación</th>
              <th className="text-left text-xs text-muted p-3">Estado</th>
              <th className="text-left text-xs text-muted p-3">Fecha Límite</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ncs.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6 text-muted">Sin registros</td></tr>
            ) : (
              ncs.map((nc) => (
                <tr key={nc.id} className="border-b border-border/50 hover:bg-surface/30">
                  <td className="p-3 text-sm font-mono text-primary">{nc.codigo}</td>
                  <td className="p-3 text-sm text-text max-w-xs truncate">{nc.descripcion}</td>
                  <td className="p-3 text-sm text-muted">{nc.tipo}</td>
                  <td className="p-3 text-sm text-muted">{nc.clasificacion}</td>
                  <td className="p-3"><BadgeEstado estado={nc.estado} /></td>
                  <td className="p-3 text-sm text-muted">{formatDate(nc.fecha_limite)}</td>
                  <td className="p-3">
                    <Link href={`/no-conformidades/${nc.id}`}><Button variant="ghost" size="sm">Ver</Button></Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
