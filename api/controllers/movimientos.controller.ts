/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreateMovimientoSchema, UpdateMovimientoSchema, GetMovimientosQuerySchema } from '../schemas/movimiento.schema';
import { movimientoService } from '../services/movimientos/movimientoService';

const unauth = (r: FastifyReply) => r.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));

export const movimientosController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = GetMovimientosQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Query inválida', code: 400, error: parsed.error.errors }));
    const { data, error } = await movimientoService.list(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  get: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await movimientoService.get(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  create: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateMovimientoSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await movimientoService.create(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },
  update: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = UpdateMovimientoSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await movimientoService.update(req.userContext.id, Number((req.params as any).id), parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await movimientoService.remove(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
