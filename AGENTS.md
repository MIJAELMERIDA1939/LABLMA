# SGC — Project Context for AI Agents

## Skills requeridas (cargar automáticamente)

1. **sgc** — Mapa completo del proyecto (modelos, rutas, API, stack, convenciones)
2. **gsap-animations** — Animaciones profesionales con GSAP
3. **ui-ux-pro-max** — Sistema de diseño, accesibilidad, temas, layout

## Stack resumen

- **Frontend**: Next.js 14 (App Router) + TypeScript 5 + Tailwind 3.4 + Recharts
- **Backend**: FastAPI + SQLAlchemy async + PostgreSQL/SQLite + Alembic
- **Auth**: JWT + bcrypt + role-based matrix
- **Infra**: Docker Compose o Vercel

## Punto de partida

- Raíz del proyecto: `D:\LABUGRAM\sgc`
- Backend: `backend/app/main.py`
- Frontend: `frontend/src/app/page.tsx`
- Demo: `npm run dev` (o `.\start.ps1 -mode dev`)
- Seed: `npm run seed` (5 usuarios demo)

## Regla de oro

Antes de modificar cualquier archivo, lee el contexto circundante (imports, patrones del vecindario) para mantener consistencia. No añadas comentarios a menos que se te pida explícitamente.
