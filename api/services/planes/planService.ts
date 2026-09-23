import { PlanRepository } from '../../repositories/plan.repository';
import { CreatePlanData, UpdatePlanData } from '../../interfaces/plan.interface';

const repo = new PlanRepository();

export class PlanServiceClass {
  async list(userId: number, id_meta?: number) {
    const { data, error } = await repo.list(userId, id_meta);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar planes', details: error } };
    return { data, error: null };
  }
  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener plan', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Plan no encontrado', details: null } };
    return { data, error: null };
  }
  async create(userId: number, input: CreatePlanData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear plan', details: error } };
    return { data, error: null };
  }
  async update(userId: number, id: number, input: UpdatePlanData) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) return { data: null, error: { status: 404, message: 'Plan no encontrado', details: null } };
    const { data, error } = await repo.update(id, userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar plan', details: error } };
    return { data, error: null };
  }
  async remove(userId: number, id: number) {
    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar plan', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Plan no encontrado', details: null } };
    return { data: true, error: null };
  }
}

export const planService = new PlanServiceClass();
