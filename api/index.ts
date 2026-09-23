import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import env from '@fastify/env';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';

import { authRoutes } from './routes/auth.routes';
import { suenosRoutes } from './routes/suenos.routes';
import { metasRoutes } from './routes/metas.routes';
import { planesRoutes } from './routes/planes.routes';
import { rutinasRoutes } from './routes/rutinas.routes';
import { tareasRoutes } from './routes/tareas.routes';
import { ahorrosRoutes } from './routes/ahorros.routes';
import { categoriasRoutes } from './routes/categorias.routes';
import { movimientosRoutes } from './routes/movimientos.routes';
import { kpisRoutes } from './routes/kpis.routes';
import { itemsRoutes } from './routes/items.routes';
import { errorHandler } from './libs/errorHandler';
import { runStartupMigrations } from './libs/startupMigrations';

const server = fastify({ logger: true });

const envSchema = {
  type: 'object',
  required: ['JWT_SECRET', 'HOST', 'PORT'],
  properties: {
    JWT_SECRET: { type: 'string' },
    HOST: { type: 'string' },
    PORT: { type: 'string' },
    FRONTEND_URL: { type: 'string' },
  },
};

server.register(env, {
  schema: envSchema,
  dotenv: true,
});

server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
});

server.register(helmet, { contentSecurityPolicy: false });
server.register(sensible);

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret',
});

server.register(swagger, {
  openapi: {
    info: {
      title: 'Finanzas Personales API',
      description: 'API Clean Architecture — sueños, metas, ahorros, gastos y KPIs',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

server.register(swaggerUi, {
  routePrefix: '/docs',
});

server.setErrorHandler(errorHandler);

server.get('/health', async () => ({ status: 'ok', service: 'finanzas-api' }));

server.register(authRoutes, { prefix: '/auth' });
server.register(suenosRoutes, { prefix: '/suenos' });
server.register(metasRoutes, { prefix: '/metas' });
server.register(planesRoutes, { prefix: '/planes' });
server.register(rutinasRoutes, { prefix: '/rutinas' });
server.register(tareasRoutes, { prefix: '/tareas' });
server.register(ahorrosRoutes, { prefix: '/ahorros' });
server.register(categoriasRoutes, { prefix: '/categorias' });
server.register(movimientosRoutes, { prefix: '/movimientos' });
server.register(kpisRoutes, { prefix: '/kpis' });
server.register(itemsRoutes, { prefix: '/items' });

const start = async () => {
  try {
    await runStartupMigrations();

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Finanzas API listening on http://${host}:${port}`);
    console.log(`Swagger docs: http://${host}:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
