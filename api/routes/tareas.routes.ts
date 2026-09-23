import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { tareasController } from '../controllers/tareas.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function tareasRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', tareasController.list);
  server.get('/:id', tareasController.get);
  server.post('/', tareasController.create);
  server.put('/:id', tareasController.update);
  server.delete('/:id', tareasController.remove);
}
