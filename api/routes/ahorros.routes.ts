import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ahorrosController } from '../controllers/ahorros.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function ahorrosRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', ahorrosController.list);
  server.get('/:id', ahorrosController.get);
  server.post('/', ahorrosController.create);
  server.put('/:id', ahorrosController.update);
  server.delete('/:id', ahorrosController.remove);
  server.post('/:id/aportes', ahorrosController.addAporte);
  server.get('/:id/aportes', ahorrosController.listAportes);
}
