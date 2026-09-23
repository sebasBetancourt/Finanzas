/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { kpiService } from '../services/kpis/kpiService';

export const kpisController = {
  dashboard: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) {
      return reply.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));
    }
    const { data, error } = await kpiService.dashboard(ctx.id);
    if (error) {
      return reply.status(error.status).send(errorResponse({
        message: error.message,
        code: error.status,
        error: error.details,
      }));
    }
    return reply.send(successResponse(data));
  },
};
