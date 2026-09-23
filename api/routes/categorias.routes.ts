import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { categoriasController } from '../controllers/categorias.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function categoriasRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', categoriasController.list);
  server.post('/', categoriasController.create);
}
