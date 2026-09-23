import { MovimientoRepository } from '../../repositories/movimiento.repository';
import { CreateMovimientoData, UpdateMovimientoData } from '../../interfaces/movimiento.interface';

const repo = new MovimientoRepository();

export class MovimientoServiceClass {
  async list(userId: number, filters?: { tipo?: string; desde?: string; hasta?: string; id_categoria?: number }) {
    const { data, error } = await repo.list(userId, filters);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar movimientos', details: error } };
    return { data, error: null };
  }
  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener movimiento', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Movimiento no encontrado', details: null } };
    return { data, error: null };
  }
  async create(userId: number, input: CreateMovimientoData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear movimiento', details: error } };
    return { data, error: null };
  }
  async update(userId: number, id: number, input: UpdateMovimientoData) {
    if (!(await repo.getById(id, userId)).data) return { data: null, error: { status: 404, message: 'Movimiento no encontrado', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar movimiento', details: error } };
    return { data, error: null };
  }
  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar movimiento', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Movimiento no encontrado', details: null } };
    return { data: true, error: null };
  }
}

export const movimientoService = new MovimientoServiceClass();
