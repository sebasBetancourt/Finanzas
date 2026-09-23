import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { suenosController } from '../controllers/suenos.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function suenosRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', suenosController.list);
  server.get('/:id', suenosController.get);
  server.post('/', suenosController.create);
  server.put('/:id', suenosController.update);
  server.delete('/:id', suenosController.remove);
}
