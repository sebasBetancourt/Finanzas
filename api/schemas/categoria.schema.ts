import { z } from 'zod';

export const CreateCategoriaSchema = z.object({
  nombre: z.string().min(2).max(100),
  slug: z.string().optional(),
  tipo: z.enum(['ingreso', 'egreso']),
  color: z.string().optional(),
  icono: z.string().optional(),
});

export const GetCategoriasQuerySchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
});
