import { z } from 'zod';

export const CreateMetaSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  id_sueno: z.number().int().optional().nullable(),
  tipo: z.enum(['personal', 'financiera', 'salud', 'carrera', 'otro']).optional().default('personal'),
  valor_objetivo: z.number().optional().nullable(),
  valor_actual: z.number().optional().default(0),
  unidad: z.string().optional().default('COP'),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  progreso_pct: z.number().min(0).max(100).optional().default(0),
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']).optional().default('pendiente'),
});

export const UpdateMetaSchema = CreateMetaSchema.partial();
