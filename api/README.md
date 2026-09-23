# API — Finanzas

Fastify + PostgreSQL. Corre **solo con Docker** (sin nginx ni Redis).

## Arranque

```bash
cd api
cp .env.example .env   # primera vez
docker compose up --build -d
```

- API: http://localhost:3001  
- Swagger: http://localhost:3001/docs  
- Postgres (host): `localhost:5433`

```bash
docker compose logs -f api
docker compose down
```

## Estructura Clean Architecture

```
routes → controllers → services → repositories → PostgreSQL
```

Schema SQL: `docs/schema.sql`
