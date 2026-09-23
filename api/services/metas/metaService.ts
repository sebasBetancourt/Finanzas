import { MetaRepository } from '../../repositories/meta.repository';
import { CreateMetaData, UpdateMetaData } from '../../interfaces/meta.interface';

const repo = new MetaRepository();

export class MetaServiceClass {
  async list(userId: number, filters?: { id_sueno?: number; estado?: string }) {
    const { data, error } = await repo.list(userId, filters);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar metas', details: error } };
    return { data, error: null };
  }

  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener meta', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Meta no encontrada', details: null } };
    return { data, error: null };
  }

  async create(userId: number, input: CreateMetaData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear meta', details: error } };
    return { data, error: null };
  }

  async update(userId: number, id: number, input: UpdateMetaData) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) return { data: null, error: { status: 404, message: 'Meta no encontrada', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar meta', details: error } };
    return { data, error: null };
  }

  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar meta', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Meta no encontrada', details: null } };
    return { data: true, error: null };
  }
}

export const metaService = new MetaServiceClass();
