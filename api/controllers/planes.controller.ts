/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreatePlanSchema, UpdatePlanSchema } from '../schemas/plan.schema';
import { planService } from '../services/planes/planService';

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));
}

export const planesController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id_meta = (req.query as any).id_meta ? Number((req.query as any).id_meta) : undefined;
    const { data, error } = await planService.list(ctx.id, id_meta);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  get: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const { data, error } = await planService.get(ctx.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  create: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const parsed = CreatePlanSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await planService.create(ctx.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },
  update: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const parsed = UpdatePlanSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await planService.update(ctx.id, Number((req.params as any).id), parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const { data, error } = await planService.remove(ctx.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
