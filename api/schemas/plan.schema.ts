import { z } from 'zod';

export const CreatePlanSchema = z.object({
  id_meta: z.number().int(),
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  pasos: z.array(z.any()).optional().default([]),
  estado: z.enum(['activo', 'pausado', 'completado', 'archivado']).optional().default('activo'),
});

export const UpdatePlanSchema = CreatePlanSchema.partial().omit({ id_meta: true }).extend({
  id_meta: z.number().int().optional(),
});
