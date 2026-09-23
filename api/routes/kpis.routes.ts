import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { kpisController } from '../controllers/kpis.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function kpisRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/dashboard', kpisController.dashboard);
}
