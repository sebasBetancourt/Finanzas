import { z } from 'zod';

export const CreateTareaSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  fecha_programada: z.string().min(1),
  hora_inicio: z.string().optional().nullable(),
  hora_fin: z.string().optional().nullable(),
  id_meta: z.number().int().optional().nullable(),
  id_rutina: z.number().int().optional().nullable(),
  id_plan: z.number().int().optional().nullable(),
  prioridad: z.number().int().min(1).max(5).optional().default(3),
  completada: z.boolean().optional().default(false),
});

export const UpdateTareaSchema = CreateTareaSchema.partial();

export const CalendarioQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});
