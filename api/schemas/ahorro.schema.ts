import { z } from 'zod';

export const CreateAhorroSchema = z.object({
  nombre: z.string().min(2).max(200),
  monto_objetivo: z.number().positive(),
  monto_actual: z.number().min(0).optional().default(0),
  fecha_objetivo: z.string().optional().nullable(),
  aporte_sugerido: z.number().positive().optional().nullable(),
  id_meta: z.number().int().optional().nullable(),
  estado: z.enum(['activa', 'completada', 'pausada', 'cancelada']).optional().default('activa'),
});

export const UpdateAhorroSchema = CreateAhorroSchema.partial();

export const CreateAporteSchema = z.object({
  monto: z.number().positive(),
  nota: z.string().optional(),
  fecha: z.string().optional(),
});
