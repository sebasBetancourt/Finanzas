import { FastifyRequest, FastifyReply } from 'fastify';
import { errorResponse } from '../libs/responseHelper';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    const payload = req.user as any;
    req.userContext = {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
    };
  } catch (err) {
    return reply
      .status(401)
      .send(errorResponse({ message: 'Unauthorized', code: 401, error: err }));
  }
}
