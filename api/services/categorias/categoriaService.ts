import { CategoriaRepository } from '../../repositories/categoria.repository';
import { CreateCategoriaData } from '../../interfaces/categoria.interface';

const repo = new CategoriaRepository();

export class CategoriaServiceClass {
  async list(userId: number, tipo?: string) {
    const { data, error } = await repo.list(userId, tipo);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar categorías', details: error } };
    return { data, error: null };
  }
  async create(userId: number, input: CreateCategoriaData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear categoría', details: error } };
    return { data, error: null };
  }
}

export const categoriaService = new CategoriaServiceClass();
