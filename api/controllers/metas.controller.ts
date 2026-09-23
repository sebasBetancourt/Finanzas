/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreateMetaSchema, UpdateMetaSchema } from '../schemas/meta.schema';
import { metaService } from '../services/metas/metaService';

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));
}

export const metasController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const q = req.query as any;
    const filters = {
      id_sueno: q.id_sueno ? Number(q.id_sueno) : undefined,
      estado: q.estado as string | undefined,
    };
    const { data, error } = await metaService.list(ctx.id, filters);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  get: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const { data, error } = await metaService.get(ctx.id, id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  create: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const parsed = CreateMetaSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await metaService.create(ctx.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },
  update: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const parsed = UpdateMetaSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await metaService.update(ctx.id, id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) return unauthorized(reply);
    const id = Number((req.params as any).id);
    const { data, error } = await metaService.remove(ctx.id, id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
