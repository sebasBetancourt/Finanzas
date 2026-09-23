import { RutinaRepository } from '../../repositories/rutina.repository';
import { CreateRutinaData, UpdateRutinaData } from '../../interfaces/rutina.interface';

const repo = new RutinaRepository();

export class RutinaServiceClass {
  async list(userId: number) {
    const { data, error } = await repo.list(userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar rutinas', details: error } };
    return { data, error: null };
  }
  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener rutina', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Rutina no encontrada', details: null } };
    return { data, error: null };
  }
  async create(userId: number, input: CreateRutinaData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear rutina', details: error } };
    return { data, error: null };
  }
  async update(userId: number, id: number, input: UpdateRutinaData) {
    if (!(await repo.getById(id, userId)).data) return { data: null, error: { status: 404, message: 'Rutina no encontrada', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar rutina', details: error } };
    return { data, error: null };
  }
  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar rutina', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Rutina no encontrada', details: null } };
    return { data: true, error: null };
  }
}

export const rutinaService = new RutinaServiceClass();
