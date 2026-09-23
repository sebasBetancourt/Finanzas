import { z } from 'zod';

export const CreateSuenoSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  imagen_url: z.string().url().optional().or(z.literal('')),
  prioridad: z.number().int().min(1).max(5).optional().default(3),
  estado: z.enum(['activo', 'en_progreso', 'logrado', 'archivado']).optional().default('activo'),
  fecha_objetivo: z.string().optional().nullable(),
});

export const UpdateSuenoSchema = CreateSuenoSchema.partial();

export type CreateSuenoInput = z.infer<typeof CreateSuenoSchema>;
export type UpdateSuenoInput = z.infer<typeof UpdateSuenoSchema>;
