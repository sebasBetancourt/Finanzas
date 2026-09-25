import { z } from 'zod';

export const ItemTipoEnum = z.enum(['ingreso', 'gasto', 'deuda', 'inversion', 'ahorro']);
export const ItemEstadoEnum = z.enum([
  'pendiente',
  'programado',
  'en_proceso',
  'ahorro',
  'completado',
  'cancelado',
]);

export const CreateItemSchema = z.object({
  titulo: z.string().min(1).max(200),
  tipo: ItemTipoEnum,
  monto_total: z.number().min(0),
  monto_pagado: z.number().min(0).optional().default(0),
  estado: ItemEstadoEnum.optional().default('pendiente'),
  fecha: z.string().optional().nullable(),
  /** Desde cuándo cuenta (recurrencia / acumulación). Por defecto = fecha. */
  fecha_inicio: z.string().optional().nullable(),
  notas: z.string().optional(),
  id_item_padre: z.number().int().positive().optional().nullable(),
  es_recurrente: z.boolean().optional().default(false),
});

export const CreateDeudaPlanSchema = z.object({
  titulo: z.string().min(1).max(200),
  cuota_mensual: z.number().positive(),
  n_cuotas: z.number().int().positive().max(360),
  cuota_inicial: z.number().min(0).optional().default(0),
  /** Cantidad de cuotas ya pagadas (0…n_cuotas), no es un monto en pesos */
  cuotas_pagadas: z.number().int().min(0).optional().default(0),
  /** Monto ya pagado en COP (si se envía, tiene prioridad sobre cuotas_pagadas) */
  monto_pagado: z.number().min(0).optional(),
  dia_cobro: z.number().int().min(1).max(28).optional().default(1),
  /** Desde qué mes cuenta la deuda/cuotas (no acumula atrasos anteriores) */
  fecha_inicio: z.string().optional(),
  notas: z.string().optional(),
});

export const UpdateItemSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  tipo: ItemTipoEnum.optional(),
  monto_total: z.number().min(0).optional(),
  monto_pagado: z.number().min(0).optional(),
  estado: ItemEstadoEnum.optional(),
  fecha: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  id_item_padre: z.number().int().positive().optional().nullable(),
  cuota_mensual: z.number().min(0).optional().nullable(),
  n_cuotas: z.number().int().min(0).optional().nullable(),
  cuotas_pagadas: z.number().int().min(0).optional().nullable(),
  dia_cobro: z.number().int().min(1).max(28).optional().nullable(),
  cuota_inicial: z.number().min(0).optional().nullable(),
  es_recurrente: z.boolean().optional(),
  fecha_inicio: z.string().optional().nullable(),
});

export const AbonoSchema = z.object({
  monto: z.number().positive(),
  nota: z.string().optional(),
});

export const GetItemsQuerySchema = z.object({
  tipo: ItemTipoEnum.optional(),
  estado: ItemEstadoEnum.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  /** Vista de un mes concreto: YYYY-MM. Deudas padre siempre se incluyen. */
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  /** Si true, lista todo sin filtrar por mes */
  todos: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  /** Búsqueda inteligente: título, notas, vínculo (padre), monto */
  q: z.string().max(120).optional(),
});

export const PresupuestoMesSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  ingreso_total: z.number().min(0),
  notas: z.string().optional().nullable(),
});

export const CopiarMesSchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}$/),
  hacia: z.string().regex(/^\d{4}-\d{2}$/),
});
