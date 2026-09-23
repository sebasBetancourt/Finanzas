/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { CreateCategoriaSchema } from '../schemas/categoria.schema';
import { categoriaService } from '../services/categorias/categoriaService';

const unauth = (r: FastifyReply) => r.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));

export const categoriasController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const tipo = (req.query as any).tipo as string | undefined;
    const { data, error } = await categoriaService.list(req.userContext.id, tipo);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
  create: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateCategoriaSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    const { data, error } = await categoriaService.create(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },
};
