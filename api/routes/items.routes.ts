import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { itemsController } from '../controllers/items.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function itemsRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.addHook('preHandler', authMiddleware);
  server.get('/', itemsController.list);
  server.get('/resumen', itemsController.resumen);
  server.get('/auditoria', itemsController.auditoria);
  server.get('/presupuesto', itemsController.getPresupuesto);
  server.put('/presupuesto', itemsController.setPresupuesto);
  server.post('/copiar-mes', itemsController.copiarMes);
  server.post('/deuda-plan', itemsController.createDeudaPlan);
  server.get('/metas-mes', itemsController.listMetasMes);
  server.post('/metas-mes', itemsController.createMetaMes);
  server.delete('/metas-mes/:id', itemsController.removeMetaMes);
  server.get('/:id', itemsController.get);
  server.post('/', itemsController.create);
  server.put('/:id', itemsController.update);
  server.delete('/:id', itemsController.remove);
  server.post('/:id/abonos', itemsController.addAbono);
}
