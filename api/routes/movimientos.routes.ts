import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { movimientosController } from '../controllers/movimientos.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function movimientosRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', movimientosController.list);
  server.get('/:id', movimientosController.get);
  server.post('/', movimientosController.create);
  server.put('/:id', movimientosController.update);
  server.delete('/:id', movimientosController.remove);
}
