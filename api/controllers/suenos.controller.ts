/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreateSuenoSchema, UpdateSuenoSchema } from '../schemas/sueno.schema';
import { suenoService } from '../services/suenos/suenoService';

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));
}

export const suenosController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const { data, error } = await suenoService.list(ctx.id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  get: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const { data, error } = await suenoService.get(ctx.id, id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  create: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const parsed = CreateSuenoSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await suenoService.create(ctx.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  update: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const parsed = UpdateSuenoSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await suenoService.update(ctx.id, id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const { data, error } = await suenoService.remove(ctx.id, id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
