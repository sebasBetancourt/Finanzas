import { SuenoRepository } from '../../repositories/sueno.repository';
import { CreateSuenoData, UpdateSuenoData } from '../../interfaces/sueno.interface';

const repo = new SuenoRepository();

export class SuenoServiceClass {
  async list(userId: number) {
    const { data, error } = await repo.list(userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar sueños', details: error } };
    return { data, error: null };
  }

  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener sueño', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Sueño no encontrado', details: null } };
    return { data, error: null };
  }

  async create(userId: number, input: CreateSuenoData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear sueño', details: error } };
    return { data, error: null };
  }

  async update(userId: number, id: number, input: UpdateSuenoData) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) return { data: null, error: { status: 404, message: 'Sueño no encontrado', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar sueño', details: error } };
    return { data, error: null };
  }

  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar sueño', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Sueño no encontrado', details: null } };
    return { data: true, error: null };
  }
}

export const suenoService = new SuenoServiceClass();
