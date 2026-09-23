# Arquitectura — Plataforma de Finanzas y Metas Personales

Misma arquitectura limpia y stack que `waiwahost_plataforma`.

## Stack

| Capa | Tecnología |
|------|------------|
| API | Fastify 5 + TypeScript (ESM) |
| Validación | Zod |
| Auth | JWT (`fastify-jwt`) + bcrypt |
| DB | PostgreSQL 15 (`pg`) |
| Frontend | React 19 + Vite + React Router + Tailwind + Radix-like UI |
| Charts | Recharts |
| Forms | Controlled forms + Zod (API) |
| Deploy | Docker Compose + Nginx |

## Capas (Clean Architecture)

```
Request
  → routes/          (registro HTTP + middleware)
  → controllers/     (validación Zod, orquestación HTTP)
  → services/        (casos de uso / reglas de negocio)
  → repositories/    (SQL / acceso a datos)
  → PostgreSQL
```

Contratos:

- `interfaces/` — entidades y DTOs de dominio
- `schemas/` — Zod (entrada HTTP)
- `libs/` — db, responseHelper, migraciones
- `middlewares/` — auth, errorHandler

Convención de respuesta:

```ts
successResponse(data) → { isError: false, data, code, timestamp }
errorResponse({ message, code, error }) → { isError: true, data: null, ... }
```

Servicios retornan `{ data, error }` (mismo patrón Waiwa).

## Dominio

| Módulo | Responsabilidad |
|--------|-----------------|
| auth | Registro, login, JWT |
| suenos | Visión a largo plazo |
| metas | Objetivos con fechas y progreso |
| planes | Estrategias ligadas a metas |
| rutinas | Hábitos recurrentes |
| tareas | Calendario / to-dos |
| ahorros | Metas de ahorro y aportes |
| categorias | Categorías de gasto/ingreso |
| movimientos | Ingresos y egresos |
| kpis | Métricas y dashboard |

## Frontend (React SPA)

```
frontend/
  src/
    main.tsx       — entry Vite
    App.tsx        — React Router
    pages/         — pantallas
    layouts/       — shell dashboard
    auth/          — AuthContext, apiFetch
    components/    — UI + sidebar
    services/      — clientes HTTP (VITE_API_URL → api:3001)
```

## Arranque

- API: `cd api && docker compose up --build -d`
- Frontend: `cd frontend && pnpm install && pnpm dev`

No hay nginx ni Redis en este setup: el frontend Vite llama directo a `http://localhost:3001`.
