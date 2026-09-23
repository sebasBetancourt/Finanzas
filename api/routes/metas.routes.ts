import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { metasController } from '../controllers/metas.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function metasRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', metasController.list);
  server.get('/:id', metasController.get);
  server.post('/', metasController.create);
  server.put('/:id', metasController.update);
  server.delete('/:id', metasController.remove);
}
