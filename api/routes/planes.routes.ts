import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { planesController } from '../controllers/planes.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function planesRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', planesController.list);
  server.get('/:id', planesController.get);
  server.post('/', planesController.create);
  server.put('/:id', planesController.update);
  server.delete('/:id', planesController.remove);
}
