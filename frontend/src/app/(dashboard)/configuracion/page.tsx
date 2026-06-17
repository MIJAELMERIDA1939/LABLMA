"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ConfiguracionPage() {
  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    user: "",
    password: "",
  })

  const [whatsapp, setWhatsapp] = useState({
    token: "",
    phone_number_id: "",
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text">Configuración del Sistema</h1>

      <Card>
        <CardHeader>
          <CardTitle>SMTP - Correo Electrónico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Servidor SMTP</label>
              <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Puerto</label>
              <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Usuario</label>
            <Input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Contraseña</label>
            <Input type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
          </div>
          <Button variant="outline">Probar Conexión</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Token de Acceso</label>
            <Input value={whatsapp.token} onChange={(e) => setWhatsapp({ ...whatsapp, token: e.target.value })} type="password" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Phone Number ID</label>
            <Input value={whatsapp.phone_number_id} onChange={(e) => setWhatsapp({ ...whatsapp, phone_number_id: e.target.value })} />
          </div>
          <Button variant="outline">Probar Conexión</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted">Versión:</span> 1.0.0</p>
          <p><span className="text-muted">Estado:</span> <span className="text-success">Running</span></p>
          <p><span className="text-muted">Entorno:</span> {process.env.NODE_ENV}</p>
        </CardContent>
      </Card>
    </div>
  )
}
