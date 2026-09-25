/// <reference path="../types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse } from '../libs/responseHelper';
import {
  CreateItemSchema,
  CreateDeudaPlanSchema,
  UpdateItemSchema,
  AbonoSchema,
  GetItemsQuerySchema,
  PresupuestoMesSchema,
  CopiarMesSchema,
  CreateMetaMesSchema,
} from '../schemas/item.schema';
import { itemService } from '../services/items/itemService';

const unauth = (r: FastifyReply) =>
  r.status(401).send(errorResponse({ message: 'No autenticado', code: 401 }));

export const itemsController = {
  list: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = GetItemsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Query inválida', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.list(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  resumen: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await itemService.resumen(req.userContext.id);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  auditoria: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const q = req.query as { anio?: string; mes?: string };
    const anio = Number(q.anio);
    const mes = Number(q.mes);
    if (!anio || !mes || mes < 1 || mes > 12) {
      return reply.status(400).send(errorResponse({ message: 'anio y mes requeridos', code: 400 }));
    }
    const { data, error } = await itemService.auditoriaMes(req.userContext.id, anio, mes);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  getPresupuesto: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const q = req.query as { anio?: string; mes?: string };
    const anio = Number(q.anio);
    const mes = Number(q.mes);
    if (!anio || !mes) {
      return reply.status(400).send(errorResponse({ message: 'anio y mes requeridos', code: 400 }));
    }
    const { data, error } = await itemService.getPresupuesto(req.userContext.id, anio, mes);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  setPresupuesto: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = PresupuestoMesSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { anio, mes, ingreso_total, notas } = parsed.data;
    const { data, error } = await itemService.setPresupuesto(
      req.userContext.id,
      anio,
      mes,
      ingreso_total,
      notas
    );
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  copiarMes: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CopiarMesSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.copiarMes(
      req.userContext.id,
      parsed.data.desde,
      parsed.data.hacia
    );
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  get: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await itemService.get(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  create: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.create(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  createDeudaPlan: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateDeudaPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.createDeudaPlan(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  update: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = UpdateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.update(
      req.userContext.id,
      Number((req.params as any).id),
      parsed.data
    );
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  remove: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await itemService.remove(req.userContext.id, Number((req.params as any).id));
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  addAbono: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = AbonoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.addAbono(
      req.userContext.id,
      Number((req.params as any).id),
      parsed.data.monto
    );
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  listMetasMes: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const q = req.query as { anio?: string; mes?: string };
    const anio = Number(q.anio);
    const mes = Number(q.mes);
    if (!anio || !mes || mes < 1 || mes > 12) {
      return reply.status(400).send(errorResponse({ message: 'anio y mes requeridos', code: 400 }));
    }
    const { data, error } = await itemService.listMetasMes(req.userContext.id, anio, mes);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },

  createMetaMes: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const parsed = CreateMetaMesSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(errorResponse({ message: 'Datos inválidos', code: 400, error: parsed.error.errors }));
    }
    const { data, error } = await itemService.createMetaMes(req.userContext.id, parsed.data);
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.status(201).send(successResponse(data, 201));
  },

  removeMetaMes: async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.userContext?.id) return unauth(reply);
    const { data, error } = await itemService.removeMetaMes(
      req.userContext.id,
      Number((req.params as any).id)
    );
    if (error) return reply.status(error.status).send(errorResponse({ message: error.message, code: error.status, error: error.details }));
    return reply.send(successResponse(data));
  },
};
