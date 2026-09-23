/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema';
import { registerService, loginService, meService } from '../services/auth/authService';

export const authController = {
  register: async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({
        message: 'Datos inválidos',
        code: 400,
        error: parsed.error.errors,
      }));
    }

    const { data, error } = await registerService.execute(parsed.data);
    if (error) {
      return reply.status(error.status).send(errorResponse({
        message: error.message,
        code: error.status,
        error: error.details,
      }));
    }

    const token = req.server.jwt.sign({
      id: data!.id_usuario,
      email: data!.email,
      nombre: data!.nombre,
    });

    return reply.status(201).send(successResponse({ user: data, token }, 201));
  },

  login: async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({
        message: 'Datos inválidos',
        code: 400,
        error: parsed.error.errors,
      }));
    }

    const { data, error } = await loginService.execute(parsed.data);
    if (error) {
      return reply.status(error.status).send(errorResponse({
        message: error.message,
        code: error.status,
        error: error.details,
      }));
    }

    const token = req.server.jwt.sign({
      id: data!.id_usuario,
      email: data!.email,
      nombre: data!.nombre,
    });

    return reply.send(successResponse({ user: data, token }));
  },

  me: async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.userContext;
    if (!ctx?.id) {
      return reply.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));
    }

    const { data, error } = await meService.execute(ctx.id);
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
