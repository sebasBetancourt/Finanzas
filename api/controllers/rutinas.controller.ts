/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreateRutinaSchema, UpdateRutinaSchema } from '../schemas/rutina.schema';
import { rutinaService } from '../services/rutinas/rutinaService';

const unauth = (r: FastifyReply) => r.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));

export const rutinasController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await rutinaService.list(req.userContext.id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  get: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await rutinaService.get(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  create: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateRutinaSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await rutinaService.create(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },
  update: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = UpdateRutinaSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await rutinaService.update(req.userContext.id, Number((req.params as any).id), parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await rutinaService.remove(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
