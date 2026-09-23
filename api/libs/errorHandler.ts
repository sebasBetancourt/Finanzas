import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { errorResponse } from '../libs/responseHelper';

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  req.log.error(error);
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send(
    errorResponse({
      message: error.message || 'Error interno del servidor',
      code: statusCode,
      error: process.env.NODE_ENV === 'production' ? undefined : error,
    })
  );
}
