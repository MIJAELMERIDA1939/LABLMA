# SGC - Sistema de Gestión de Calidad

Sistema integral para la gestión de calidad que cumple con normas ISO 9001, ISO 17025, ISO 14001 e ISO 45000.

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Documentos** | Ciclo de vida completo: borrador → revisión → aprobado → vigente → obsoleto. Control de versiones, lista maestra, editor de contenido |
| **No Conformidades** | Registro, flujo de cierre (análisis → plan → ejecución → cierre → validación), alertas de vencimiento |
| **Riesgos** | Matriz probabilidad/impacto, mapa de calor, tratamiento |
| **Planes y Programas** | Diagrama Gantt con tareas, responsables, fechas y progreso |
| **Dashboard** | KPIs, gráficas, alertas de próximos vencimientos |
| **Notificaciones** | In-app, email (SMTP) y WhatsApp Business API |
| **Usuarios y Roles** | Admin, director, responsable, verificador, elaborador, consultor |

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Python FastAPI, SQLAlchemy 2.0 (async), PostgreSQL
- **Autenticación:** JWT + bcrypt
- **PDF:** WeasyPrint + Jinja2
- **Notificaciones:** SMTP (fastapi-mail) + WhatsApp Cloud API (Meta)
- **Tareas programadas:** APScheduler
- **Infraestructura:** Docker, Vercel (demo), Servidor local Nginx (producción)

## Requisitos

- Node.js 20+
- Python 3.12+
- PostgreSQL 15+
- Docker (opcional)

## Setup Local

### Requisitos

- Python 3.12+ con `venv`
- Node.js 20+
- PostgreSQL 15+ (o Docker para levantar solo PostgreSQL)

### 1. Clonar e instalar dependencias (solo una vez)

```bash
git clone <repo-url> sgc
cd sgc

# Backend — crear venv e instalar
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
cd ..

# Frontend — instalar
cd frontend
npm install
cd ..

# Raíz — instalar concurrently
npm install
```

### 2. Configurar variables de entorno

```bash
copy .env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
# Editar backend\.env con tu conexión PostgreSQL
```

### 3. ¡Un solo comando para arrancar todo!

```bash
npm run dev
```

Esto ejecuta **migraciones + seed + backend + frontend** simultáneamente.

**Alternativa con PowerShell:**
```powershell
.\start.ps1
```

### 4. Abrir en el navegador

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

### Usuarios Demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sgc.local | Admin1234! | Admin |
| director@sgc.local | Director1234! | Director |
| responsable@sgc.local | Resp1234! | Responsable |
| verificador@sgc.local | Verif1234! | Verificador |
| elaborador@sgc.local | Elab1234! | Elaborador |

## Docker

```bash
docker-compose up --build
```

## Deploy en Vercel (Demo)

### Backend (Serverless)
```bash
cd backend
vercel --prod
```

### Frontend
```bash
cd frontend
vercel --prod
```

**Nota:** APScheduler no funciona en Vercel (serverless stateless). Las tareas automáticas se ejecutan vía cron endpoint: `GET /api/v1/scheduler/run-jobs?cron_secret=...`

## Deploy Producción (Servidor Local)

```bash
# Backend con Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app

# Frontend build
cd frontend && npm run build

# Configurar Nginx como reverse proxy
```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables.

## Licencia

MIT - Open Source
