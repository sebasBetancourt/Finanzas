import { z } from 'zod';

export const CreateRutinaSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  id_meta: z.number().int().optional().nullable(),
  frecuencia: z.enum(['diaria', 'semanal', 'mensual']).optional().default('diaria'),
  dias_semana: z.array(z.number().int().min(0).max(6)).optional().default([]),
  hora_preferida: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const UpdateRutinaSchema = CreateRutinaSchema.partial();
