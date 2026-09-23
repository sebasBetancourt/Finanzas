import { TareaRepository } from '../../repositories/tarea.repository';
import { CreateTareaData, UpdateTareaData } from '../../interfaces/tarea.interface';

const repo = new TareaRepository();

export class TareaServiceClass {
  async list(userId: number, desde?: string, hasta?: string) {
    const { data, error } = await repo.list(userId, desde, hasta);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar tareas', details: error } };
    return { data, error: null };
  }
  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener tarea', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Tarea no encontrada', details: null } };
    return { data, error: null };
  }
  async create(userId: number, input: CreateTareaData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear tarea', details: error } };
    return { data, error: null };
  }
  async update(userId: number, id: number, input: UpdateTareaData) {
    if (!(await repo.getById(id, userId)).data) return { data: null, error: { status: 404, message: 'Tarea no encontrada', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar tarea', details: error } };
    return { data, error: null };
  }
  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar tarea', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Tarea no encontrada', details: null } };
    return { data: true, error: null };
  }
}

export const tareaService = new TareaServiceClass();
