import { z } from 'zod';

export const CreateMovimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  monto: z.number().positive(),
  concepto: z.string().min(1).max(255),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
  id_categoria: z.number().int().optional().nullable(),
  es_recurrente: z.boolean().optional().default(false),
});

export const UpdateMovimientoSchema = CreateMovimientoSchema.partial();

export const GetMovimientosQuerySchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  id_categoria: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
});
