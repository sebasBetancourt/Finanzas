import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { rutinasController } from '../controllers/rutinas.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function rutinasRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', rutinasController.list);
  server.get('/:id', rutinasController.get);
  server.post('/', rutinasController.create);
  server.put('/:id', rutinasController.update);
  server.delete('/:id', rutinasController.remove);
}
