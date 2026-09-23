import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function authRoutes(server: FastifyInstance, _opts: FastifyPluginOptions) {
  server.post('/register', authController.register);
  server.post('/login', authController.login);
  server.get('/me', { preHandler: [authMiddleware] }, authController.me);
}
